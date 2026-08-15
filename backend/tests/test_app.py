import os
import io
import pytest
from flask_jwt_extended import create_access_token

os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')

from app import create_app
from config.database import db
from models.user import User
from models.service import Service

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


def test_admin_can_view_inactive_services():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()
        admin = User(username='adminsvc', email='adminsvc@example.com', full_name='Admin Service', role='admin', verified=True)
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()

        service = Service(name='Legacy Cut', category='Hair', description='Archived service', price=40.0, duration_minutes=30, active=False)
        db.session.add(service)
        db.session.commit()

        token = create_access_token(identity=str(admin.id), additional_claims={'role': admin.role, 'email': admin.email})

        with app.test_client() as client:
            response = client.get('/api/services?include_inactive=true', headers={'Authorization': f'Bearer {token}'})
            assert response.status_code == 200
            data = response.get_json()
            assert data['services']
            assert any(item['id'] == service.id for item in data['services'])


def test_appointments_manage_is_exempt_from_rate_limit_for_admin():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()
        admin = User(username='adminmanage', email='adminmanage@example.com', full_name='Admin Manage', role='admin', verified=True)
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()

        token = create_access_token(identity=str(admin.id), additional_claims={'role': admin.role, 'email': admin.email})

        with app.test_client() as client:
            for index in range(60):
                response = client.get('/api/appointments/manage', headers={'Authorization': f'Bearer {token}'})
                assert response.status_code == 200, f'Request {index + 1} unexpectedly rate-limited: {response.status_code} {response.get_data(as_text=True)[:200]}'


def test_uploaded_service_image_uses_portable_static_url():
    app = create_app()
    app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', MAIL_SUPPRESS_SEND=True)

    with app.app_context():
        db.drop_all()
        db.create_all()
        admin = User(username='imgadmin', email='imgadmin@example.com', full_name='Image Admin', role='admin', verified=True)
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()

        token = create_access_token(identity=str(admin.id), additional_claims={'role': admin.role, 'email': admin.email})
        image_bytes = (b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\x9cc`\x00\x00\x00\x02\x00\x01\xe2!\x1d\x00\x00\x00\x00IEND\xaeB`\x82')

        with app.test_client() as client:
            response = client.post(
                '/api/services',
                data={
                    'name': 'Fresh Cut',
                    'category': 'Hair',
                    'description': 'Test service',
                    'price': '45',
                    'duration_minutes': '30',
                    'active': 'true',
                },
                content_type='multipart/form-data',
                headers={'Authorization': f'Bearer {token}'},
                buffered=True,
            )

            assert response.status_code == 400

            response = client.post(
                '/api/services',
                data={
                    'name': 'Fresh Cut',
                    'category': 'Hair',
                    'description': 'Test service',
                    'price': '45',
                    'duration_minutes': '30',
                    'active': 'true',
                    'image_file': (io.BytesIO(image_bytes), 'test.png'),
                },
                content_type='multipart/form-data',
                headers={'Authorization': f'Bearer {token}'},
                buffered=True,
            )

            assert response.status_code == 201
            data = response.get_json()
            image_url = data['service']['image_url']
            assert image_url is not None
            assert image_url.startswith('/static/services/')
            assert 'localhost' not in image_url and '127.0.0.1' not in image_url
