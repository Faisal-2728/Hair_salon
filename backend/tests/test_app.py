import os
import pytest

os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')

from app import create_app
from config.database import db
from models.user import User

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_root(client):
    rv = client.get('/')
    assert rv.status_code == 200
    data = rv.get_json()
    assert data and 'message' in data


def test_password_reset_code_flow():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(username='resetter', email='resetter@example.com', full_name='Resetter', role='customer', verified=True)
        user.set_password('old-password')
        db.session.add(user)
        db.session.commit()

        with app.test_client() as client:
            forgot_response = client.post('/api/auth/forgot-password', json={'email': 'resetter@example.com'})
            assert forgot_response.status_code == 200

            refreshed_user = db.session.get(User, user.id)
            assert refreshed_user.password_reset_code is not None
            code = refreshed_user.password_reset_code

            verify_response = client.post('/api/auth/verify-reset-code', json={'email': 'resetter@example.com', 'code': code})
            assert verify_response.status_code == 200

            reset_response = client.post('/api/auth/reset-password', json={
                'email': 'resetter@example.com',
                'code': code,
                'password': 'new-password-123',
            })
            assert reset_response.status_code == 200

            refreshed_user = db.session.get(User, user.id)
            assert refreshed_user.check_password('new-password-123')
            assert refreshed_user.password_reset_code is None


def test_registration_persists_verification_otp_and_hashed_password():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()

        with app.test_client() as client:
            response = client.post('/api/auth/register', json={
                'username': 'otpuser',
                'email': 'otpuser@example.com',
                'password': 'Password123!',
                'full_name': 'OTP User',
            })

            assert response.status_code == 201

            user = User.query.filter_by(email='otpuser@example.com').first()
            assert user is not None
            assert user.email_verification_otp is not None
            assert user.email_otp_expires is not None
            assert user.check_password('Password123!')
            assert user.verified is False


def test_forgot_password_persists_reset_code_and_expiry():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()
        user = User(username='forgotter', email='forgotter@example.com', full_name='Forgotter', role='customer', verified=True)
        user.set_password('old-password')
        db.session.add(user)
        db.session.commit()

        with app.test_client() as client:
            response = client.post('/api/auth/forgot-password', json={'email': 'forgotter@example.com'})
            assert response.status_code == 200

            refreshed_user = db.session.get(User, user.id)
            assert refreshed_user.password_reset_code is not None
            assert refreshed_user.password_reset_expires is not None
            assert refreshed_user.password_reset_code.isdigit()
