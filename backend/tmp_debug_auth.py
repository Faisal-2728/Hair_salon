import os
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
from app import create_app
from config.database import db
from models.user import User

app = create_app()
app.config.update(TESTING=True, MAIL_SUPPRESS_SEND=True)

with app.app_context():
    db.drop_all()
    db.create_all()
    for username, email, password, role in [
        ('admin', 'admin@salon.local', 'Admin123!', 'admin'),
        ('staff', 'staff@salon.local', 'Staff123!', 'staff'),
        ('customer', 'customer@salon.local', 'Customer123!', 'customer'),
    ]:
        user = User(username=username, email=email, full_name=username.capitalize(), role=role, verified=True)
        user.set_password(password)
        db.session.add(user)
    db.session.commit()

    client = app.test_client()
    for identifier, password in [
        ('admin', 'Admin123!'),
        ('staff', 'Staff123!'),
        ('customer', 'Customer123!'),
    ]:
        resp = client.post('/api/auth/login', json={'identifier': identifier, 'password': password})
        print('LOGIN', identifier, resp.status_code, resp.get_json())

    resp = client.post('/api/auth/forgot-password', json={'email': 'admin@salon.local'})
    print('FORGOT', resp.status_code, resp.get_json())
    user = User.query.filter_by(email='admin@salon.local').first()
    print('USER RESET CODE', user.password_reset_code, user.password_reset_expires)
