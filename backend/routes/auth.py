from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, make_response
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt, set_refresh_cookies, unset_jwt_cookies
from sqlalchemy import or_, func, text
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from werkzeug.security import check_password_hash
from config.database import db
from models.user import User
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from utils.email import send_email

auth_bp = Blueprint('auth', __name__)


def _find_user_by_email(email: str):
    normalized = email.strip().lower()
    return User.query.filter(func.lower(User.email) == normalized).first()


def _find_user_by_identifier(identifier: str):
    normalized = identifier.strip().lower()
    if '@' in normalized:
        return User.query.filter(
            or_(func.lower(User.email) == normalized, func.lower(User.username) == normalized)
        ).first()
    return User.query.filter(func.lower(User.username) == normalized).first()


def _create_user_access_token(user):
    return create_access_token(
        identity=str(user.id),
        additional_claims={
            'role': user.role,
            'email': user.email,
        }
    )


def _create_user_refresh_token(user):
    return create_refresh_token(
        identity=str(user.id),
        additional_claims={
            'role': user.role,
            'email': user.email,
        }
    )


@auth_bp.route('/register', methods=['POST'])
def register():
    payload = request.get_json() or {}
    email = payload.get('email', '').strip().lower()
    username = (payload.get('username') or (email.split('@')[0] if email else '')).strip()
    password = payload.get('password', '').strip()
    full_name = payload.get('full_name', '').strip()

    # Input validation
    if not email or not password or not full_name or not username:
        return jsonify({'error': 'Username, email, full name, and password are required'}), 400

    if len(email) > 254 or '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400

    if len(username) < 3 or len(username) > 80:
        return jsonify({'error': 'Username must be 3-80 characters'}), 400
    
    if not all(c.isalnum() or c in '_-' for c in username):
        return jsonify({'error': 'Username can only contain letters, numbers, underscore, and dash'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if len(full_name) < 2 or len(full_name) > 120:
        return jsonify({'error': 'Full name must be 2-120 characters'}), 400

    try:
        if User.query.filter(or_(func.lower(User.email) == email, func.lower(User.username) == username.lower())).first():
            return jsonify({'error': 'Email or username already registered'}), 409

        user = User(username=username, email=email, full_name=full_name, role='customer', verified=False)
        user.set_password(password)
        otp = user.generate_email_otp()
        db.session.add(user)
        db.session.commit()

        subject = 'Salon App Email Verification Code'
        html = f"""
        <div style='font-family:Arial,sans-serif;color:#111;'>
            <h2 style='color:#5b21b6;'>Salon App email verification</h2>
            <p>Hi {user.full_name},</p>
            <p>Welcome to Salon App. Use the code below to verify your email address. This code expires in 10 minutes.</p>
            <div style='margin:30px 0;padding:20px;background:#f4f3ff;border-radius:12px;text-align:center;'>
                <p style='font-size:28px;letter-spacing:0.28em;margin:0;font-weight:700;color:#111;'>{otp}</p>
            </div>
            <p>If you did not create this account, please ignore this message.</p>
            <p style='color:#555;margin-top:24px;'>Thank you,<br/>Salon App Team</p>
        </div>
        """
        text = f"Salon App email verification code:\n\nHi {user.full_name},\n\nUse the following code to verify your email address: {otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, ignore this email.\n\nThank you,\nSalon App Team"

        if not send_email(user.email, subject, html, text):
            current_app.logger.warning('Email verification message could not be delivered to %s', user.email)

        return jsonify({
            'message': 'Registration successful. A verification code has been sent to your email.',
            'email': user.email
        }), 201
    except SQLAlchemyError as err:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(err)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    payload = request.get_json() or {}
    identifier = (payload.get('identifier') or payload.get('email') or '').strip()
    password = payload.get('password', '').strip()

    # Input validation
    if not identifier or not password:
        return jsonify({'error': 'Email/username and password are required'}), 400

    # Validate input lengths
    if len(identifier) > 254 or len(password) > 255:
        return jsonify({'error': 'Invalid input'}), 400

    normalized_identifier = identifier.strip().lower()
    try:
        user = _find_user_by_identifier(normalized_identifier)
        
        # Check if account is locked
        if user and user.locked_until and user.locked_until > datetime.utcnow():
            return jsonify({'error': 'Account is temporarily locked due to too many failed login attempts. Try again later.'}), 429
        
        # Reset login attempts on successful identification
        if user and user.locked_until and user.locked_until <= datetime.utcnow():
            user.login_attempts = 0
            user.locked_until = None
            db.session.commit()
        
        if not user or not user.check_password(password):
            # Increment failed login attempts
            if user:
                user.login_attempts = (user.login_attempts or 0) + 1
                # Lock account after 5 failed attempts for 15 minutes
                if user.login_attempts >= 5:
                    user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                    current_app.logger.warning('Account locked for user %s due to too many failed login attempts', user.email)
                db.session.commit()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account disabled'}), 403
        if not user.verified:
            return jsonify({
                'error': 'Email not verified',
                'message': 'Please verify your email with the OTP sent to your inbox before logging in.',
                'email': user.email,
                'requires_verification': True
            }), 403
        
        # Reset failed login attempts on successful login
        user.login_attempts = 0
        user.locked_until = None
        db.session.commit()
        
        access_token = _create_user_access_token(user)
        refresh_token = _create_user_refresh_token(user)
        response = make_response(jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': user.to_dict()}))
        set_refresh_cookies(response, refresh_token)
        return response
    except OperationalError:
        # fallback for older DB schemas that may be missing newer columns
        try:
            sql = text("SELECT id, username, email, password_hash, full_name, phone, role, verified, is_active FROM users WHERE email = :ident OR username = :ident LIMIT 1")
            with db.engine.connect() as conn:
                res = conn.execute(sql, {'ident': identifier}).mappings().first()
            if not res:
                return jsonify({'error': 'Invalid credentials'}), 401
            stored_hash = res.get('password_hash') if 'password_hash' in res.keys() else res[3]
            if not check_password_hash(stored_hash, password):
                return jsonify({'error': 'Invalid credentials'}), 401
            user_obj = {
                'id': res.get('id'),
                'username': res.get('username'),
                'email': res.get('email'),
                'full_name': res.get('full_name'),
                'phone': res.get('phone'),
                'role': res.get('role'),
                'verified': bool(res.get('verified')),
                'is_active': bool(res.get('is_active')),
            }
            if not user_obj['is_active']:
                return jsonify({'error': 'Account disabled'}), 403
            if not user_obj['verified']:
                return jsonify({
                    'error': 'Email not verified',
                    'message': 'Please verify your email with the OTP sent to your inbox before logging in.',
                    'email': user_obj['email'],
                    'requires_verification': True
                }), 403
            access_token = create_access_token(
                identity=str(user_obj['id']),
                additional_claims={
                    'role': user_obj['role'],
                    'email': user_obj['email'],
                }
            )
            refresh_token = create_refresh_token(
                identity=str(user_obj['id']),
                additional_claims={
                    'role': user_obj['role'],
                    'email': user_obj['email'],
                }
            )
            return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': user_obj})
        except Exception:
            return jsonify({'error': 'Invalid credentials'}), 401


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify email using the code sent after registration."""
    payload = request.get_json() or {}
    email = (payload.get('email') or '').strip().lower()
    otp = (payload.get('otp') or '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required'}), 400

    if len(email) > 254 or '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400

    if len(otp) != 6 or not otp.isdigit():
        return jsonify({'error': 'OTP must be 6 digits'}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.verified:
            return jsonify({'message': 'Email is already verified', 'user': user.to_dict()}), 200

        if not user.verify_email_otp(otp):
            return jsonify({'error': 'Invalid or expired verification code'}), 400

        user.verified = True
        user.email_verification_otp = None
        user.email_otp_expires = None
        db.session.commit()

        return jsonify({
            'message': 'Email verified successfully. You can now log in.',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('Failed to verify email for %s: %s', email, e)
        return jsonify({'error': 'Failed to verify email'}), 500


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    payload = request.get_json() or {}
    email = (payload.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if len(email) > 254 or '@' not in email:
        return jsonify({'message': 'If that account exists, a new OTP has been sent'}), 200

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'If that account exists, a new OTP has been sent'}), 200

        if user.verified:
            return jsonify({'message': 'Email is already verified'}), 200

        otp = user.generate_email_otp()
        db.session.commit()

        subject = 'Salon App Email Verification Code'
        html = f"""
        <div style='font-family:Arial,sans-serif;color:#111;'>
            <h2 style='color:#5b21b6;'>Salon App email verification</h2>
            <p>Hi {user.full_name},</p>
            <p>Your verification code is:</p>
            <div style='margin:30px 0;padding:20px;background:#f4f3ff;border-radius:12px;text-align:center;'>
                <p style='font-size:28px;letter-spacing:0.28em;margin:0;font-weight:700;color:#111;'>{otp}</p>
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, ignore this email.</p>
        </div>
        """
        text = f"Salon App email verification code:\n\nHi {user.full_name},\n\nYour verification code is: {otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email."

        if not send_email(user.email, subject, html, text):
            current_app.logger.warning('OTP email could not be delivered to %s', user.email)

        return jsonify({'message': 'A new verification code has been sent to your email'}), 200
    except Exception as e:
        current_app.logger.exception('Error in resend_otp for %s: %s', email, e)
        return jsonify({'message': 'If that account exists, a new OTP has been sent'}), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    identity = get_jwt_identity()
    claims = get_jwt()
    # preserve role/email claims from the refresh token when creating a new access token
    additional = {
        'role': claims.get('role'),
        'email': claims.get('email'),
    }
    access_token = create_access_token(identity=identity, additional_claims=additional)
    return jsonify({'access_token': access_token})


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email_token():
    payload = request.get_json() or {}
    token = payload.get('token')
    if not token:
        return jsonify({'error': 'Verification token required'}), 400
    s = URLSafeTimedSerializer(current_app.config.get('SECRET_KEY', 'change-me'))
    try:
        data = s.loads(token, max_age=60 * 60 * 24)
    except SignatureExpired:
        return jsonify({'error': 'Verification token expired'}), 400
    except BadSignature:
        return jsonify({'error': 'Invalid verification token'}), 400
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.verified = True
    db.session.commit()
    return jsonify({'message': 'Email verified successfully', 'user': user.to_dict()})


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    payload = request.get_json() or {}
    current = payload.get('current_password', '').strip()
    new = payload.get('new_password', '').strip()

    if not current or not new:
        return jsonify({'error': 'Current and new password are required'}), 400

    # Prevent password reuse
    if current == new:
        return jsonify({'error': 'New password must be different from current password'}), 400

    # Validate new password strength
    if len(new) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400

    if len(new) > 255:
        return jsonify({'error': 'Password is too long'}), 400

    try:
        user = User.query.get(int(identity))
        if not user or not user.check_password(current):
            return jsonify({'error': 'Current password is incorrect'}), 403
        
        user.set_password(new)
        db.session.commit()
        return jsonify({'message': 'Password changed successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error in change_password: {e}")
        return jsonify({'error': 'Failed to change password'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # mark the current access token as revoked by adding its jti to the blocklist
    jti = get_jwt().get('jti')
    from flask import current_app
    try:
        blocklist = current_app.config.setdefault('JWT_BLOCKLIST', set())
        blocklist.add(jti)
    except Exception:
        pass

    response = jsonify({'message': 'Logged out'})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    payload = request.get_json() or {}
    email = (payload.get('email') or '').strip().lower()

    if not email or len(email) > 254 or '@' not in email:
        return jsonify({'message': 'If that account exists, a reset code has been sent to your email'}), 200

    try:
        user = _find_user_by_email(email)
        if not user:
            return jsonify({'message': 'If that account exists, a reset code has been sent to your email'}), 200

        code = user.generate_password_reset_code()
        user.password_reset_token = None
        db.session.commit()

        subject = 'Salon App Password Reset Code'
        html = f"""
        <div style='font-family:Arial,sans-serif;color:#111;'>
            <h2 style='color:#5b21b6;'>Reset your Salon App password</h2>
            <p>Hi {user.full_name},</p>
            <p>You requested a password reset. Use the code below to securely reset your password. It expires in 10 minutes.</p>
            <div style='margin:30px 0;padding:20px;background:#f4f3ff;border-radius:12px;text-align:center;'>
                <p style='font-size:28px;letter-spacing:0.28em;margin:0;font-weight:700;color:#111;'>{code}</p>
            </div>
            <p>If you did not request this, ignore this email or contact support.</p>
            <p style='color:#555;margin-top:24px;'>Thanks,<br/>Salon App Team</p>
        </div>
        """
        text = f"Salon App password reset code:\n\nHi {user.full_name},\n\nUse the code below to reset your password: {code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email or contact support.\n\nThanks,\nSalon App Team"

        if not send_email(user.email, subject, html, text):
            current_app.logger.warning('Password reset email could not be delivered to %s', user.email)

        return jsonify({'message': 'A 6-digit reset code has been sent to your email', 'email': user.email}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('Error in forgot_password for %s: %s', email, e)
        return jsonify({'message': 'If that account exists, a reset code has been sent to your email'}), 200


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    payload = request.get_json() or {}
    email = (payload.get('email') or '').strip().lower()
    code = (payload.get('code') or '').strip()

    if not email or len(email) > 254 or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    if not code or len(code) != 6 or not code.isdigit():
        return jsonify({'error': 'Reset code must be 6 digits'}), 400

    try:
        user = _find_user_by_email(email)
        if not user:
            return jsonify({'error': 'Invalid email or reset code'}), 400
        if not user.verify_password_reset_code(code):
            return jsonify({'error': 'Invalid or expired reset code'}), 400
        return jsonify({'message': 'Reset code verified successfully'}), 200
    except Exception as e:
        current_app.logger.exception('Error in verify_reset_code for %s: %s', email, e)
        return jsonify({'error': 'Failed to verify reset code'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    payload = request.get_json() or {}
    email = (payload.get('email') or '').strip().lower()
    code = (payload.get('code') or '').strip()
    password = payload.get('password', '').strip()

    if not password:
        return jsonify({'error': 'New password is required'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if len(password) > 255:
        return jsonify({'error': 'Password is too long'}), 400

    try:
        if not email or len(email) > 254 or '@' not in email:
            return jsonify({'error': 'Invalid email'}), 400

        if not code or len(code) != 6 or not code.isdigit():
            return jsonify({'error': 'Reset code must be 6 digits'}), 400

        user = _find_user_by_email(email)
        if not user or not user.verify_password_reset_code(code):
            return jsonify({'error': 'Invalid or expired reset code'}), 400

        user.set_password(password)
        user.password_reset_code = None
        user.password_reset_expires = None
        db.session.commit()

        return jsonify({'message': 'Password reset completed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('Error in reset_password for %s: %s', email, e)
        return jsonify({'error': 'Failed to reset password'}), 500


@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    return jsonify({'message': 'Email verification completed successfully'})


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()})
