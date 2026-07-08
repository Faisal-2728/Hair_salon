from datetime import datetime, timedelta
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from config.database import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(140), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    profile_picture_url = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(32), default='customer', nullable=False)
    verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    loyalty_points = db.Column(db.Integer, default=0)
    password_reset_token = db.Column(db.String(120), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    password_reset_code = db.Column(db.String(6), nullable=True)
    email_verification_otp = db.Column(db.String(6), nullable=True)
    email_otp_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = db.relationship('Transaction', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_reset_token(self, expires_in: int = 3600) -> str:
        token = secrets.token_urlsafe(32)
        self.password_reset_token = token
        self.password_reset_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return token

    def verify_reset_token(self, token: str) -> bool:
        return (
            token
            and self.password_reset_token == token
            and self.password_reset_expires is not None
            and self.password_reset_expires > datetime.utcnow()
        )

    def generate_password_reset_code(self, expires_in: int = 600) -> str:
        code = f"{secrets.randbelow(1000000):06d}"
        self.password_reset_code = code
        self.password_reset_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return code

    def verify_password_reset_code(self, code: str) -> bool:
        return (
            code
            and self.password_reset_code == code
            and self.password_reset_expires is not None
            and self.password_reset_expires > datetime.utcnow()
        )

    def generate_email_otp(self, expires_in: int = 600) -> str:
        """Generate a 6-digit OTP for email verification (expires in 10 minutes by default)"""
        otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        self.email_verification_otp = otp
        self.email_otp_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        return otp

    def verify_email_otp(self, otp: str) -> bool:
        """Verify the email OTP"""
        return (
            otp
            and self.email_verification_otp == otp
            and self.email_otp_expires is not None
            and self.email_otp_expires > datetime.utcnow()
        )


    def to_dict(self):
        """Return user data safe for API responses - NEVER includes password_hash"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'profile_picture_url': self.profile_picture_url,
            'role': self.role,
            'verified': self.verified,
            'is_active': self.is_active,
            'loyalty_points': self.loyalty_points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
