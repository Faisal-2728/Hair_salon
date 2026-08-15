from datetime import datetime
from config.database import db

class Service(db.Model):
    __tablename__ = 'services'
    __table_args__ = (
        db.Index('idx_service_active', 'active'),
        db.Index('idx_service_category', 'category'),
    )
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    category = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'price': self.price,
            'duration_minutes': self.duration_minutes,
            'image_url': self.image_url,
            'active': self.active,
        }
