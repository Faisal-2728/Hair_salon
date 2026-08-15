import csv
import io
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, make_response
from sqlalchemy import func
from config.database import db
from utils.auth import role_required
from utils.email import send_email
from models.user import User
from models.service import Service
from models.inventory import InventoryItem
from models.appointment import Appointment
from models.transaction import Transaction
from models.branch import Branch

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@role_required(['admin'])
def dashboard():
    total_revenue = db.session.query(db.func.coalesce(db.func.sum(Transaction.amount), 0)).scalar() or 0
    popular_services = [
        {'service_id': row[0], 'service_name': row[1], 'bookings': row[2]}
        for row in db.session.query(Appointment.service_id, Service.name, func.count(Appointment.id))
            .join(Service, Appointment.service_id == Service.id)
            .group_by(Appointment.service_id, Service.name)
            .order_by(func.count(Appointment.id).desc())
            .limit(5)
            .all()
    ]
    return jsonify({
        'customer_count': User.query.filter_by(role='customer').count(),
        'staff_count': User.query.filter_by(role='staff').count(),
        'appointments_total': Appointment.query.count(),
        'revenue': float(total_revenue),
        'active_branches': Branch.query.filter_by(active=True).count(),
        'popular_services': popular_services,
    })


@admin_bp.route('/customers', methods=['GET'])
@role_required(['admin'])
def list_customers():
    customers = User.query.filter_by(role='customer').all()
    return jsonify({'customers': [u.to_dict() for u in customers]})


@admin_bp.route('/customers/<int:user_id>', methods=['GET'])
@role_required(['admin'])
def get_customer(user_id):
    user = User.query.filter_by(id=user_id, role='customer').first()
    if not user:
        return jsonify({'error': 'Customer not found'}), 404
    return jsonify({'customer': user.to_dict()})


@admin_bp.route('/customers', methods=['POST'])
@role_required(['admin'])
def create_customer():
    data = request.get_json() or {}
    user = User(
        email=data.get('email'),
        username=data.get('username') or data.get('email').split('@')[0],
        full_name=data.get('full_name'),
        role='customer',
        phone=data.get('phone'),
        verified=data.get('verified', False),
    )
    user.set_password(data.get('password', 'Password123!'))
    db.session.add(user)
    db.session.commit()
    return jsonify({'customer': user.to_dict()}), 201


@admin_bp.route('/customers/<int:user_id>', methods=['PUT'])
@role_required(['admin'])
def update_customer(user_id):
    data = request.get_json() or {}
    user = User.query.filter_by(id=user_id, role='customer').first()
    if not user:
        return jsonify({'error': 'Customer not found'}), 404
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.is_active = data.get('is_active', user.is_active)
    user.verified = data.get('verified', user.verified)
    if data.get('password'):
        user.set_password(data['password'])
    db.session.commit()
    return jsonify({'customer': user.to_dict()})


@admin_bp.route('/customers/<int:user_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_customer(user_id):
    user = User.query.filter_by(id=user_id, role='customer').first()
    if not user:
        return jsonify({'error': 'Customer not found'}), 404
    user.is_active = False
    db.session.commit()
    return jsonify({'message': 'Customer deactivated successfully'})


@admin_bp.route('/staff', methods=['GET'])
@role_required(['admin'])
def list_staff():
    staff = User.query.filter_by(role='staff', is_active=True).all()
    return jsonify({'staff': [u.to_dict() for u in staff]})


@admin_bp.route('/staff/<int:user_id>', methods=['GET'])
@role_required(['admin'])
def get_staff(user_id):
    staff = User.query.filter_by(id=user_id, role='staff').first()
    if not staff:
        return jsonify({'error': 'Staff member not found'}), 404
    return jsonify({'staff': staff.to_dict()})


@admin_bp.route('/staff', methods=['POST'])
@role_required(['admin'])
def create_staff():
    data = request.get_json() or {}
    try:
        user = User(
            email=data.get('email'),
            username=data.get('username') or (data.get('email').split('@')[0] if data.get('email') else None),
            full_name=data.get('full_name'),
            role='staff',
            phone=data.get('phone'),
            verified=bool(data.get('verified', False)),
            is_active=bool(data.get('active', True)),
        )
        user.set_password(data.get('password', 'Staff123!'))
        db.session.add(user)
        db.session.commit()
        return jsonify({'staff': user.to_dict()}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Unable to create staff member', 'details': str(err)}), 400


@admin_bp.route('/staff/<int:user_id>', methods=['PUT'])
@role_required(['admin'])
def update_staff(user_id):
    data = request.get_json() or {}
    user = User.query.filter_by(id=user_id, role='staff').first()
    if not user:
        return jsonify({'error': 'Staff member not found'}), 404
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.verified = data.get('verified', user.verified)
    user.is_active = data.get('active', user.is_active)
    if data.get('password'):
        user.set_password(data['password'])
    db.session.commit()
    return jsonify({'staff': user.to_dict()})


@admin_bp.route('/staff/<int:user_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_staff(user_id):
    user = User.query.filter_by(id=user_id, role='staff').first()
    if not user:
        return jsonify({'error': 'Staff member not found'}), 404
    user.is_active = False
    db.session.commit()
    return jsonify({'message': 'Staff member deactivated successfully'})


@admin_bp.route('/inventory', methods=['GET'])
@role_required(['admin'])
def list_inventory():
    items = InventoryItem.query.all()
    return jsonify({'inventory': [item.to_dict() for item in items]})


@admin_bp.route('/inventory/<int:item_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_inventory_item(item_id):
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Inventory item not found'}), 404
    item.quantity = 0
    db.session.commit()
    return jsonify({'message': 'Inventory item cleared successfully'})


@admin_bp.route('/appointments', methods=['GET'])
@role_required(['admin'])
def list_appointments():
    appointments = Appointment.query.order_by(Appointment.appointment_time.desc()).all()
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@admin_bp.route('/appointments/<int:appointment_id>/assign', methods=['PUT'])
@role_required(['admin'])
def assign_appointment(appointment_id):
    data = request.get_json() or {}
    staff_id = data.get('staff_id')
    if not staff_id:
        return jsonify({'error': 'staff_id is required'}), 400
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    staff = User.query.filter_by(id=staff_id, role='staff').first()
    if not staff:
        return jsonify({'error': 'Staff member not found'}), 404

    # Prevent overlapping staff assignments based on service duration
    new_service = appointment.service or Service.query.get(appointment.service_id)
    new_duration = new_service.duration_minutes if new_service else 0
    new_end_time = appointment.appointment_time + timedelta(minutes=new_duration)

    staff_conflicts = Appointment.query.filter(
        Appointment.staff_id == staff_id,
        Appointment.status != 'cancelled',
        Appointment.id != appointment.id,
        Appointment.appointment_time < new_end_time,
    ).all()

    for existing in staff_conflicts:
        existing_service = existing.service or Service.query.get(existing.service_id)
        existing_duration = existing_service.duration_minutes if existing_service else 0
        existing_end = existing.appointment_time + timedelta(minutes=existing_duration)
        if appointment.appointment_time < existing_end:
            return jsonify({'error': 'This staff member is already assigned to another appointment during this time'}), 400

    appointment.staff_id = staff_id
    db.session.commit()
    
    # Send email to staff member about new appointment
    try:
        customer = appointment.customer
        service = appointment.service
        branch = appointment.branch
        appointment_time = appointment.appointment_time.strftime('%Y-%m-%d %H:%M:%S') if appointment.appointment_time else 'TBD'
        
        email_subject = f'New Appointment Assigned - {customer.full_name}'
        email_html = f"""
        <h3>New Appointment Assigned</h3>
        <p>Hello {staff.full_name},</p>
        <p>You have been assigned a new appointment:</p>
        <ul>
            <li><strong>Customer:</strong> {customer.full_name}</li>
            <li><strong>Email:</strong> {customer.email}</li>
            <li><strong>Phone:</strong> {customer.phone or 'Not provided'}</li>
            <li><strong>Service:</strong> {service.name if service else 'N/A'}</li>
            <li><strong>Date & Time:</strong> {appointment_time}</li>
            <li><strong>Branch:</strong> {branch.name if branch else 'Any'}</li>
        </ul>
        <p><strong>Status:</strong> {appointment.status}</p>
        {f'<p><strong>Notes:</strong> {appointment.notes}</p>' if appointment.notes else ''}
        <p>Please log in to your dashboard to manage this appointment.</p>
        <p>Best regards,<br/>Salon Management System</p>
        """
        email_text = f"""
New Appointment Assigned

Hello {staff.full_name},

You have been assigned a new appointment:
- Customer: {customer.full_name}
- Email: {customer.email}
- Phone: {customer.phone or 'Not provided'}
- Service: {service.name if service else 'N/A'}
- Date & Time: {appointment_time}
- Branch: {branch.name if branch else 'Any'}
- Status: {appointment.status}
{f'- Notes: {appointment.notes}' if appointment.notes else ''}

Please log in to your dashboard to manage this appointment.

Best regards,
Salon Management System
        """
        send_email(staff.email, email_subject, email_html, email_text)
    except Exception:
        logger = __import__('logging').getLogger(__name__)
        logger.exception('Failed to send staff notification email for appointment %s', appointment.id)

    return jsonify({'message': 'Appointment assigned to staff', 'appointment': appointment.to_dict()})


@admin_bp.route('/transactions', methods=['GET'])
@role_required(['admin'])
def list_transactions():
    transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
    return jsonify({'transactions': [t.to_dict() for t in transactions]})


@admin_bp.route('/debug', methods=['GET'])
@role_required(['admin'])
def debug_info():
    try:
        services_count = Service.query.count()
        staff_count = User.query.filter_by(role='staff').count()
        inventory_count = InventoryItem.query.count()
        recent_services = [s.to_dict() for s in Service.query.order_by(Service.created_at.desc()).limit(5).all()]
        recent_staff = [u.to_dict() for u in User.query.filter_by(role='staff').order_by(User.created_at.desc()).limit(5).all()]
        return jsonify({
            'services_count': services_count,
            'staff_count': staff_count,
            'inventory_count': inventory_count,
            'recent_services': recent_services,
            'recent_staff': recent_staff,
        })
    except Exception as err:
        return jsonify({'error': 'Unable to collect debug info', 'details': str(err)}), 500


@admin_bp.route('/transactions/<int:tx_id>', methods=['GET'])
@role_required(['admin'])
def get_transaction(tx_id):
    tx = Transaction.query.get(tx_id)
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify({'transaction': tx.to_dict()})


def _aggregate_monthly_data(model, date_column, value_column=None):
    current_year = datetime.utcnow().year
    query = db.session.query(
        func.strftime('%Y-%m', date_column) if db.engine.url.drivername == 'sqlite' else func.to_char(date_column, 'YYYY-MM'),
        func.count(model.id)
    ).filter(func.strftime('%Y', date_column) == str(current_year) if db.engine.url.drivername == 'sqlite' else func.date_part('year', date_column) == current_year)
    query = query.group_by('month').order_by('month')
    return [{'month': row[0], 'count': row[1]} for row in query.all()]


@admin_bp.route('/reports', methods=['GET'])
@role_required(['admin'])
def reports():
    now = datetime.utcnow()
    year_start = datetime(now.year, 1, 1)
    month_start = datetime(now.year, now.month, 1)

    revenue_by_month = [
        {'month': row[0], 'revenue': float(row[1] or 0)}
        for row in db.session.query(
            func.strftime('%Y-%m', Transaction.created_at) if db.engine.url.drivername == 'sqlite' else func.to_char(Transaction.created_at, 'YYYY-MM'),
            func.sum(Transaction.amount)
        ).filter(Transaction.status == 'completed', Transaction.created_at >= year_start)
         .group_by('month').order_by('month').all()
    ]

    appointments_by_status = [
        {'status': row[0], 'count': row[1]}
        for row in db.session.query(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status).all()
    ]

    staff_performance = [
        {'staff_id': row[0], 'completed': row[1], 'total': row[2]}
        for row in db.session.query(
            Appointment.staff_id,
            func.sum(func.case([(Appointment.status == 'completed', 1)], else_=0)),
            func.count(Appointment.id)
        ).group_by(Appointment.staff_id).all()
    ]

    return jsonify({
        'revenue_by_month': revenue_by_month,
        'appointments_by_status': appointments_by_status,
        'staff_performance': staff_performance,
        'total_customers': User.query.filter_by(role='customer').count(),
        'total_staff': User.query.filter_by(role='staff').count(),
        'active_branches': Branch.query.filter_by(active=True).count(),
    })


@admin_bp.route('/reports/export', methods=['GET'])
@role_required(['admin'])
def export_reports():
    report_type = request.args.get('type', 'appointments')
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == 'appointments':
        writer.writerow(['Appointment ID', 'Customer ID', 'Staff ID', 'Service ID', 'Branch ID', 'Appointment Time', 'Status'])
        rows = Appointment.query.order_by(Appointment.appointment_time.desc()).all()
        for appointment in rows:
            writer.writerow([
                appointment.id,
                appointment.customer_id,
                appointment.staff_id,
                appointment.service_id,
                appointment.branch_id,
                appointment.appointment_time.isoformat(),
                appointment.status,
            ])
    elif report_type == 'revenue':
        writer.writerow(['Transaction ID', 'User ID', 'Amount', 'Currency', 'Status', 'Created At'])
        rows = Transaction.query.order_by(Transaction.created_at.desc()).all()
        for tx in rows:
            writer.writerow([tx.id, tx.user_id, tx.amount, tx.currency, tx.status, tx.created_at.isoformat()])
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = f'attachment; filename={report_type}_report.csv'
    response.headers['Content-Type'] = 'text/csv'
    return response


@admin_bp.route('/settings', methods=['GET', 'PUT'])
@role_required(['admin'])
def settings():
    if request.method == 'PUT':
        return jsonify({'message': 'Settings updated'})
    return jsonify({'settings': {}})
