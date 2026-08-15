import pytest
from app import create_app
from config.database import db
import json

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.drop_all()
            db.create_all()
            # create admin user for tests
            from models.user import User
            admin = User(username='admin', email='admin@salon.local', full_name='Administrator', role='admin', verified=True)
            admin.set_password('Admin123!')
            db.session.add(admin)
            db.session.commit()
        yield client


def login_admin(client):
    resp = client.post('/api/auth/login', json={'identifier': 'admin', 'password': 'Admin123!'})
    assert resp.status_code == 200
    data = resp.get_json()
    return data['access_token']


def test_inventory_sku_and_low_stock(client):
    # ensure admin exists via seed (seed_data runs in create_app)
    token = login_admin(client)
    headers = {'Authorization': f'Bearer {token}'}

    # create an item
    item = {'name': 'Test Item', 'sku': 'TST-001', 'quantity': 2, 'threshold': 5, 'cost': 1.0}
    resp = client.post('/api/inventory', json=item, headers=headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['item']['sku'] == 'TST-001'

    # duplicate SKU should return 409
    resp2 = client.post('/api/inventory', json=item, headers=headers)
    assert resp2.status_code == 409

    # low-stock alerts should include the item (quantity 2 <= threshold 5)
    resp3 = client.get('/api/inventory/low-stock', headers=headers)
    assert resp3.status_code == 200
    alerts = resp3.get_json().get('alerts', [])
    assert any(a['sku'] == 'TST-001' for a in alerts)

    # notification should be created in DB
    from models.notification import Notification
    with client.application.app_context():
        notes = Notification.query.filter(Notification.message.like('%Test Item%')).all()
        assert len(notes) >= 1
