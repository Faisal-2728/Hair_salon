from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from config.database import db
from models.appointment import Appointment
from models.review import Review
from models.service import Service
from models.user import User
from utils.auth import get_jwt_user, role_required

customer_bp = Blueprint('customer', __name__)


@customer_bp.route('/profile', methods=['GET'])
@role_required(['customer'])
def profile():
    identity = get_jwt_user()
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@customer_bp.route('/profile', methods=['PUT'])
@role_required(['customer'])
def update_profile():
    identity = get_jwt_user()
    payload = request.get_json() or {}
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.full_name = payload.get('full_name', user.full_name)
    user.phone = payload.get('phone', user.phone)
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()})


@customer_bp.route('/appointments', methods=['GET'])
@role_required(['customer'])
def appointment_history():
    identity = get_jwt_user()
    appointments = Appointment.query.filter_by(customer_id=identity['id']).order_by(Appointment.appointment_time.desc()).all()
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@customer_bp.route('/appointments/book', methods=['POST'])
@role_required(['customer'])
def book_appointment():
    identity = get_jwt_user()
    data = request.get_json() or {}
    appointment_time = data.get('appointment_time')
    service_id = data.get('service_id')
    if not appointment_time or service_id is None:
        return jsonify({'error': 'Service and appointment time are required'}), 400
    try:
        appointment_time = datetime.fromisoformat(appointment_time)
    except ValueError:
        return jsonify({'error': 'Invalid appointment_time format'}), 400
    if appointment_time <= datetime.utcnow():
        return jsonify({'error': 'Appointment time must be in the future'}), 400

    service_ids = service_id if isinstance(service_id, (list, tuple)) else [service_id]
    try:
        service_ids = [int(sid) for sid in service_ids]
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid service_id'}), 400
    if not service_ids:
        return jsonify({'error': 'At least one service is required'}), 400

    services = Service.query.filter(Service.id.in_(service_ids)).all()
    if len(services) != len(service_ids):
        return jsonify({'error': 'One or more selected services are invalid'}), 400

    conflict = _check_customer_conflict(identity['id'], appointment_time, service_ids=service_ids)
    if conflict:
        return jsonify({'error': conflict}), 400

    created = []
    try:
        for sid in service_ids:
            appointment = Appointment(
                customer_id=identity['id'],
                service_id=sid,
                staff_id=None,
                branch_id=None,
                appointment_time=appointment_time,
                status='pending',
                notes=data.get('notes'),
            )
            db.session.add(appointment)
            db.session.flush()
            created.append(appointment.to_dict())
        db.session.commit()
        return jsonify({'message': 'Appointment booked successfully', 'appointments': created}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Unable to book appointment', 'details': str(err)}), 500


@customer_bp.route('/appointments/reschedule', methods=['PUT'])
@role_required(['customer'])
def reschedule_appointment():
    identity = get_jwt_user()
    data = request.get_json() or {}
    appointment = Appointment.query.get(data.get('appointment_id'))
    if not appointment or appointment.customer_id != identity['id']:
        return jsonify({'error': 'Appointment not found or access denied'}), 404
    if appointment.status == 'cancelled':
        return jsonify({'error': 'Cancelled appointments cannot be rescheduled'}), 400
    appointment_time = data.get('appointment_time')
    if not appointment_time:
        return jsonify({'error': 'Appointment time is required'}), 400
    try:
        new_time = datetime.fromisoformat(appointment_time)
    except ValueError:
        return jsonify({'error': 'Invalid appointment_time format'}), 400
    if new_time <= datetime.utcnow():
        return jsonify({'error': 'Appointment time must be in the future'}), 400

    service_ids = [appointment.service_id]
    conflict = _check_customer_conflict(identity['id'], new_time, service_ids=service_ids, ignore_id=appointment.id)
    if conflict:
        return jsonify({'error': conflict}), 400

    appointment.appointment_time = new_time
    appointment.status = 'rescheduled'
    db.session.commit()
    return jsonify({'message': 'Appointment rescheduled', 'appointment': appointment.to_dict()})


@customer_bp.route('/appointments/cancel', methods=['PUT'])
@role_required(['customer'])
def cancel_appointment():
    identity = get_jwt_user()
    data = request.get_json() or {}
    appointment = Appointment.query.get(data.get('appointment_id'))
    if not appointment or appointment.customer_id != identity['id']:
        return jsonify({'error': 'Appointment not found or access denied'}), 404
    appointment.status = 'cancelled'
    db.session.commit()
    return jsonify({'message': 'Appointment cancelled', 'appointment': appointment.to_dict()})


@customer_bp.route('/favorites', methods=['GET'])
@role_required(['customer'])
def favorites():
    return jsonify({'favorites': []})


@customer_bp.route('/notifications', methods=['GET'])
@role_required(['customer'])
def notifications():
    return jsonify({'notifications': []})


@customer_bp.route('/reviews', methods=['POST'])
@role_required(['customer'])
def reviews():
    identity = get_jwt_user()
    payload = request.get_json() or {}
    rating = payload.get('rating')
    service_id = payload.get('service_id')
    appointment_id = payload.get('appointment_id')
    if not service_id or rating is None:
        return jsonify({'error': 'Service and rating are required'}), 400
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({'error': 'Rating must be a number'}), 400
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    review = Review(
        user_id=identity['id'],
        service_id=service_id,
        appointment_id=appointment_id,
        rating=rating,
        comment=payload.get('comment'),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review created successfully', 'review': review.to_dict()}), 201


def _check_customer_conflict(customer_id, appointment_time, service_ids=None, ignore_id=None):
    filters = [Appointment.customer_id == customer_id, Appointment.status != 'cancelled']
    if ignore_id:
        filters.append(Appointment.id != ignore_id)

    total_duration_minutes = 0
    if service_ids:
        services = Service.query.filter(Service.id.in_(service_ids)).all()
        total_duration_minutes = sum(s.duration_minutes for s in services)

    end_time = appointment_time + timedelta(minutes=total_duration_minutes)

    existing_appointments = Appointment.query.filter(*filters, Appointment.appointment_time < end_time).all()
    for existing in existing_appointments:
        existing_service = existing.service or Service.query.get(existing.service_id)
        existing_duration = existing_service.duration_minutes if existing_service else 0
        existing_end = existing.appointment_time + timedelta(minutes=existing_duration)
        if appointment_time < existing_end:
            return 'You already have an appointment during this time period'
    return None


@customer_bp.route('/loyalty', methods=['GET'])
@role_required(['customer'])
def loyalty_points():
    identity = get_jwt_user()
    user = User.query.get(identity['id'])
    return jsonify({'loyalty_points': user.loyalty_points if user else 0})
