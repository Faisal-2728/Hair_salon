import logging
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import and_, or_
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth import get_jwt_user
from config.database import db
from models.appointment import Appointment
from models.service import Service
from models.branch import Branch
from models.user import User
from utils.email import send_email
from utils.auth import role_required

logger = logging.getLogger(__name__)
appointments_bp = Blueprint('appointments', __name__)


def _validate_status(status):
    allowed = ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'in_progress']
    return status if status in allowed else None


def _check_conflict(appointment_time, staff_id, customer_id, ignore_id=None):
    filters = [Appointment.status != 'cancelled']
    if ignore_id:
        filters.append(Appointment.id != ignore_id)
    if staff_id:
        staff_conflict = Appointment.query.filter(*filters, Appointment.staff_id == staff_id, Appointment.appointment_time == appointment_time).first()
        if staff_conflict:
            return 'Staff member is already booked at that time'
    if customer_id:
        customer_conflict = Appointment.query.filter(*filters, Appointment.customer_id == customer_id, Appointment.appointment_time == appointment_time).first()
        if customer_conflict:
            return 'Customer already has an appointment at that time'
    return None


@appointments_bp.route('/availability', methods=['GET'])
@role_required(['customer'])
def availability():
    service_id = request.args.get('service_id')
    date = request.args.get('date')
    if not service_id or not date:
        return jsonify({'available_slots': []})
    try:
        target_date = datetime.fromisoformat(date).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    try:
        service_id = int(service_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid service_id'}), 400
    existing = Appointment.query.filter(
        Appointment.service_id == service_id,
        db.func.date(Appointment.appointment_time) == target_date,
        Appointment.status != 'cancelled'
    ).all()
    slots = [f'{hour:02d}:00' for hour in range(9, 18)]
    booked_times = {appt.appointment_time.strftime('%H:%M') for appt in existing}
    available = [slot for slot in slots if slot not in booked_times]
    return jsonify({'available_slots': available})


@appointments_bp.route('/status/<int:appointment_id>', methods=['GET'])
@jwt_required()
def appointment_status(appointment_id):
    identity = get_jwt_user()
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    if identity.get('role') == 'staff' and appointment.staff_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403
    if identity.get('role') == 'customer' and appointment.customer_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'status': appointment.status})


@appointments_bp.route('/manage', methods=['GET'])
@jwt_required()
def manage_appointments():
    identity = get_jwt_user()
    role = identity.get('role')
    if role == 'staff':
        appointments = Appointment.query.filter_by(staff_id=identity['id']).order_by(Appointment.appointment_time.desc()).all()
    elif role == 'admin':
        appointments = Appointment.query.order_by(Appointment.appointment_time.desc()).all()
    else:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@appointments_bp.route('/book', methods=['POST'])
@jwt_required()
def book_appointment():
    identity = get_jwt_user()
    data = request.get_json() or {}
    appointment_time = data.get('appointment_time')
    service_id = data.get('service_id')
    if not appointment_time or not service_id:
        return jsonify({'error': 'Service and appointment time are required'}), 400
    try:
        appointment_time = datetime.fromisoformat(appointment_time)
    except ValueError:
        return jsonify({'error': 'Invalid appointment_time format'}), 400
    if appointment_time <= datetime.utcnow():
        return jsonify({'error': 'Appointment time must be in the future'}), 400

    staff_id = data.get('staff_id')
    if staff_id is not None:
        try:
            staff_id = int(staff_id)
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid staff_id'}), 400

    service_ids = service_id if isinstance(service_id, (list, tuple)) else [service_id]
    try:
        service_ids = [int(sid) for sid in service_ids]
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid service_id'}), 400

    conflict = _check_conflict(appointment_time, staff_id, identity['id'])
    if conflict:
        return jsonify({'error': conflict}), 400

    services = Service.query.filter(Service.id.in_(service_ids)).all()
    if len(services) != len(service_ids):
        return jsonify({'error': 'One or more selected services are invalid'}), 400

    created = []
    try:
        for sid in service_ids:
            appointment = Appointment(
                customer_id=identity['id'],
                service_id=sid,
                staff_id=staff_id,
                branch_id=None,
                appointment_time=appointment_time,
                status='pending',
                notes=data.get('notes'),
            )
            db.session.add(appointment)
            db.session.flush()
            created.append(appointment.to_dict())
        db.session.commit()
        try:
            user = User.query.get(identity['id'])
            if user and user.email:
                svc_names = [service.name for service in services]
                appt_time_str = appointment_time.strftime('%Y-%m-%d %H:%M')
                subject = 'Appointment confirmed — Salon App'
                html = f"""
                    <div style=\"font-family:Arial,sans-serif;color:#333;margin:0;padding:0;line-height:1.5;max-width:600px;width:100%;\">
                      <h2 style=\"color:#4f46e5;\">Appointment Confirmed</h2>
                      <p>Hi {user.full_name},</p>
                      <p>Your appointment for {', '.join(svc_names)} has been booked for <strong>{appt_time_str}</strong>.</p>
                      <p>We look forward to serving you at our salon.</p>
                      <p style=\"font-size:0.9rem;color:#6b7280;\">If you have any questions, reply to this email.</p>
                    </div>
                """
                text = f"Hi {user.full_name},\n\nYour appointment for {', '.join(svc_names)} has been booked for {appt_time_str}.\n\nWe look forward to serving you at our salon.\n"
                send_email(user.email, subject, html, text)
        except Exception:
            pass

        return jsonify({'message': 'Appointment(s) booked successfully', 'appointments': created}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Unable to book appointment', 'details': str(err)}), 500


@appointments_bp.route('/mine', methods=['GET'])
@jwt_required()
def my_appointments():
    identity = get_jwt_user()
    appointments = Appointment.query.filter_by(customer_id=identity['id']).order_by(Appointment.appointment_time.desc()).all()
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@appointments_bp.route('/search', methods=['GET'])
@jwt_required()
def search_appointments():
    identity = get_jwt_user()
    status = request.args.get('status')
    staff_id = request.args.get('staff_id')
    service_id = request.args.get('service_id')
    branch_id = request.args.get('branch_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    query = Appointment.query
    if identity.get('role') == 'staff':
        query = query.filter(Appointment.staff_id == identity['id'])
    elif identity.get('role') == 'customer':
        query = query.filter(Appointment.customer_id == identity['id'])
    elif identity.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    if status:
        query = query.filter(Appointment.status == status)
    if staff_id:
        query = query.filter(Appointment.staff_id == staff_id)
    if service_id:
        query = query.filter(Appointment.service_id == service_id)
    if branch_id:
        query = query.filter(Appointment.branch_id == branch_id)
    if date_from:
        try:
            query = query.filter(Appointment.appointment_time >= datetime.fromisoformat(date_from))
        except ValueError:
            return jsonify({'error': 'Invalid date_from format'}), 400
    if date_to:
        try:
            query = query.filter(Appointment.appointment_time <= datetime.fromisoformat(date_to))
        except ValueError:
            return jsonify({'error': 'Invalid date_to format'}), 400

    appointments = query.order_by(Appointment.appointment_time.desc()).all()
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@appointments_bp.route('/calendar', methods=['GET'])
@jwt_required()
def appointment_calendar():
    identity = get_jwt_user()
    start = request.args.get('start')
    end = request.args.get('end')
    query = Appointment.query
    if identity.get('role') == 'staff':
        query = query.filter(Appointment.staff_id == identity['id'])
    elif identity.get('role') == 'customer':
        query = query.filter(Appointment.customer_id == identity['id'])
    elif identity.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    if start:
        try:
            query = query.filter(Appointment.appointment_time >= datetime.fromisoformat(start))
        except ValueError:
            return jsonify({'error': 'Invalid start date format'}), 400
    if end:
        try:
            query = query.filter(Appointment.appointment_time <= datetime.fromisoformat(end))
        except ValueError:
            return jsonify({'error': 'Invalid end date format'}), 400
    appointments = query.order_by(Appointment.appointment_time.asc()).all()
    calendar = {}
    for appointment in appointments:
        date_key = appointment.appointment_time.date().isoformat()
        calendar.setdefault(date_key, []).append(appointment.to_dict())
    return jsonify({'calendar': calendar})


@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    identity = get_jwt_user()
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    if identity.get('role') == 'staff' and appointment.staff_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403
    if identity.get('role') == 'customer' and appointment.customer_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json() or {}
    appointment_time = data.get('appointment_time')
    if appointment_time:
        try:
            new_time = datetime.fromisoformat(appointment_time)
            if new_time <= datetime.utcnow():
                return jsonify({'error': 'Appointment time must be in the future'}), 400
            conflict = _check_conflict(new_time, appointment.staff_id, appointment.customer_id, ignore_id=appointment.id)
            if conflict:
                return jsonify({'error': conflict}), 400
            appointment.appointment_time = new_time
        except ValueError:
            return jsonify({'error': 'Invalid appointment_time format'}), 400

    staff_id = data.get('staff_id', appointment.staff_id)
    if staff_id is not None:
        try:
            staff_id = int(staff_id)
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid staff_id'}), 400
        if staff_id != appointment.staff_id:
            conflict = _check_conflict(appointment.appointment_time, staff_id, appointment.customer_id, ignore_id=appointment.id)
            if conflict:
                return jsonify({'error': conflict}), 400
        appointment.staff_id = staff_id

    appointment.service_id = data.get('service_id', appointment.service_id)
    appointment.branch_id = data.get('branch_id', appointment.branch_id)
    appointment.notes = data.get('notes', appointment.notes)
    if data.get('status'):
        status = _validate_status(data.get('status'))
        if not status:
            return jsonify({'error': 'Invalid status'}), 400
        appointment.status = status

    db.session.commit()
    return jsonify({'message': 'Appointment updated', 'appointment': appointment.to_dict()})


@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    identity = get_jwt_user()
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    if identity.get('role') == 'staff' and appointment.staff_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403
    if identity.get('role') == 'customer' and appointment.customer_id != identity['id']:
        return jsonify({'error': 'Access denied'}), 403
    appointment.status = 'cancelled'
    db.session.commit()
    return jsonify({'message': 'Appointment cancelled', 'appointment': appointment.to_dict()})


@appointments_bp.route('/<int:appointment_id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    identity = get_jwt_user()
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    # allow admin, or staff assigned to this appointment, or the owning customer
    if identity.get('role') == 'staff':
        if appointment.staff_id != identity['id']:
            return jsonify({'error': 'Access denied'}), 403
    elif identity.get('role') == 'admin':
        pass
    else:
        if appointment.customer_id != identity['id']:
            return jsonify({'error': 'Access denied'}), 403
    data = request.get_json() or {}
    status = data.get('status')
    if status not in ['pending', 'confirmed', 'in_progress', 'rescheduled', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    old_status = appointment.status
    appointment.status = status
    db.session.commit()
    
    # Send email to customer about status change
    customer = appointment.customer
    service = appointment.service
    appointment_time = appointment.appointment_time.strftime('%Y-%m-%d %H:%M:%S') if appointment.appointment_time else 'TBD'
    
    status_messages = {
        'pending': 'Your appointment is pending and awaiting confirmation.',
        'confirmed': 'Your appointment has been confirmed!',
        'in_progress': 'Your appointment is currently in progress.',
        'completed': 'Your appointment has been completed. Thank you for visiting us!',
        'cancelled': 'Your appointment has been cancelled.',
        'rescheduled': 'Your appointment has been rescheduled.'
    }
    
    status_message = status_messages.get(status, f'Your appointment status is now {status}.')
    email_subject = f'Appointment status update — Salon App'
    email_html = f"""
        <div style=\"font-family:Arial,sans-serif;color:#111;max-width:620px;padding:20px;\">
          <h2 style=\"color:#4f46e5;\">Appointment Status Update</h2>
          <p>Hello {customer.full_name},</p>
          <p>{status_message}</p>
          <div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0;\">
            <p style=\"margin:0 0 8px;\"><strong>Service:</strong> {service.name if service else 'N/A'}</p>
            <p style=\"margin:0 0 8px;\"><strong>Date & Time:</strong> {appointment_time}</p>
            <p style=\"margin:0;\"><strong>Status:</strong> {status.replace('_', ' ').title()}</p>
          </div>
          <p>If you have any questions, please contact us.</p>
          <p style=\"margin-top:24px;color:#64748b;\">Best regards,<br/>Salon Management System</p>
        </div>
    """
    email_text = f"""
Appointment Status Update

Hello {customer.full_name},

{status_message}

Appointment Details:
- Service: {service.name if service else 'N/A'}
- Date & Time: {appointment_time}
- Status: {status.replace('_', ' ').title()}

If you have any questions, please contact us.

Best regards,
Salon Management System
    """
    try:
        send_email(customer.email, email_subject, email_html, email_text)
    except Exception:
        logger.exception('Failed to send customer notification email for appointment %s', appointment.id)
    return jsonify({'message': 'Appointment status updated', 'appointment': appointment.to_dict()})
