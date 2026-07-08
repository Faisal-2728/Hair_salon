from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from utils.auth import role_required, get_jwt_user
from models.appointment import Appointment
from models.user import User
from datetime import datetime, timedelta



staff_bp = Blueprint('staff', __name__)


@staff_bp.route('/dashboard', methods=['GET'])
@role_required(['staff'])
def dashboard():
    identity = get_jwt_user()
    appointments = Appointment.query.filter_by(staff_id=identity['id']).count()
    return jsonify({'assigned_appointments': appointments, 'today_availability': [], 'performance_score': 0})


@staff_bp.route('/profile', methods=['GET'])
@role_required(['staff'])
def profile():
    identity = get_jwt_user()
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({'error': 'Staff not found'}), 404
    return jsonify({'staff': user.to_dict()})


@staff_bp.route('/appointments', methods=['GET'])
@role_required(['staff'])
def assigned_appointments():
    identity = get_jwt_user()
    appointments = Appointment.query.filter_by(staff_id=identity['id']).all()
    return jsonify({'appointments': [a.to_dict() for a in appointments]})


@staff_bp.route('/schedule', methods=['GET'])
@role_required(['staff'])
def schedule():
    identity = get_jwt_user()
    today = datetime.utcnow().date()
    cutoff = today + timedelta(days=14)
    appts = Appointment.query.filter(Appointment.staff_id == identity['id'], Appointment.appointment_time >= datetime.utcnow(), Appointment.appointment_time <= datetime.combine(cutoff, datetime.max.time())).order_by(Appointment.appointment_time.asc()).all()
    return jsonify({'schedule': [a.to_dict() for a in appts]})


@staff_bp.route('/attendance', methods=['GET'])
@role_required(['staff'])
def attendance():
    # Basic attendance stub - return last 30 days presence based on appointments
    identity = get_jwt_user()
    since = datetime.utcnow() - timedelta(days=30)
    count = Appointment.query.filter(Appointment.staff_id == identity['id'], Appointment.appointment_time >= since).count()
    return jsonify({'attendance_count_last_30_days': count})


@staff_bp.route('/performance', methods=['GET'])
@role_required(['staff'])
def performance():
    identity = get_jwt_user()
    total = Appointment.query.filter_by(staff_id=identity['id']).count()
    completed = Appointment.query.filter_by(staff_id=identity['id'], status='completed').count()
    return jsonify({'total_appointments': total, 'completed_appointments': completed, 'completion_rate': (completed / total) if total else 0})
