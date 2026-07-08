from config.database import db
from models import User, Branch, Service, InventoryItem


def seed_data():
    if not User.query.filter_by(role='admin').first():
        admin = User(
            username='admin',
            email='admin@salon.local',
            full_name='Administrator',
            role='admin',
            verified=True,
        )
        admin.set_password('Admin123!')
        db.session.add(admin)

    if not User.query.filter_by(role='staff').first():
        staff = User(
            username='staff',
            email='staff@salon.local',
            full_name='Salon Stylist',
            role='staff',
            verified=True,
        )
        staff.set_password('Staff123!')
        db.session.add(staff)

    if not User.query.filter_by(role='customer').first():
        customer = User(
            username='customer',
            email='customer@salon.local',
            full_name='Sample Customer',
            role='customer',
            verified=True,
        )
        customer.set_password('Customer123!')
        db.session.add(customer)

    if not Branch.query.first():
        branch = Branch(
            name='Central Salon',
            address='123 Main Street',
            phone='(555) 123-4567',
            active=True,
        )
        db.session.add(branch)

    if not Service.query.first():
        services = [
            Service(name='Haircut', category='Hair', description='Professional haircut styling', price=35.0, duration_minutes=45),
            Service(name='Hair Color', category='Hair', description='Custom coloring and gloss finish', price=75.0, duration_minutes=90),
            Service(name='Manicure', category='Nails', description='Nail shaping and polish', price=25.0, duration_minutes=30),
        ]
        db.session.bulk_save_objects(services)

    if not InventoryItem.query.first():
        inventory = InventoryItem(name='Shampoo', sku='SHM-001', description='Premium salon shampoo', quantity=50, threshold=10, supplier='BeautySupplies Inc.', cost=8.5)
        db.session.add(inventory)

    db.session.commit()


if __name__ == '__main__':
    from app import create_app

    app = create_app()
    with app.app_context():
        seed_data()
        print('Seed data loaded successfully.')
