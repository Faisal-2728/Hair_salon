from datetime import datetime
from config.database import db

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    appointment_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='pending')

    customer = db.relationship('User', foreign_keys=[customer_id])
    staff = db.relationship('User', foreign_keys=[staff_id])
    service = db.relationship('Service')
    branch = db.relationship('Branch')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'staff_id': self.staff_id,
            'service_id': self.service_id,
            'branch_id': self.branch_id,
            'appointment_time': self.appointment_time.isoformat(),
            'status': self.status,
            'notes': self.notes,
            'customer': self.customer.to_dict() if hasattr(self, 'customer') and self.customer else None,
            'staff': self.staff.to_dict() if hasattr(self, 'staff') and self.staff else None,
            'service': self.service.to_dict() if hasattr(self, 'service') and self.service else None,
            'branch': self.branch.to_dict() if hasattr(self, 'branch') and self.branch else None,
        }
