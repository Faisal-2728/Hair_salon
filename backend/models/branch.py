from datetime import datetime
from config.database import db


class Branch(db.Model):
    __tablename__ = 'branches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'active': self.active,
        }
