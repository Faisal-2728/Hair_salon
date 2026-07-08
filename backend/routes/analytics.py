from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from config.database import db
from models.transaction import Transaction
from models.user import User
from models.appointment import Appointment
from models.service import Service
from models.branch import Branch
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/', methods=['GET'])
@jwt_required()
def analytics():
    total_revenue = db.session.query(db.func.coalesce(db.func.sum(Transaction.amount), 0)).scalar() or 0
    cutoff = datetime.utcnow() - timedelta(days=30)
    new_customers = User.query.filter(User.created_at >= cutoff).count()
    total_appointments = Appointment.query.count()
    completed_appointments = Appointment.query.filter_by(status='completed').count()
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
        'revenue': float(total_revenue),
        'new_customers': new_customers,
        'total_appointments': total_appointments,
        'completed_appointments': completed_appointments,
        'branch_count': Branch.query.filter_by(active=True).count(),
        'popular_services': popular_services,
    })
