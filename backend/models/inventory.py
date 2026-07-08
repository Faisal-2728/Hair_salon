from datetime import datetime
from config.database import db


class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    sku = db.Column(db.String(80), unique=True, nullable=True)
    description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Integer, default=0)
    threshold = db.Column(db.Integer, default=5)
    supplier = db.Column(db.String(140), nullable=True)
    cost = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'description': self.description,
            'quantity': self.quantity,
            'threshold': self.threshold,
            'supplier': self.supplier,
            'cost': self.cost,
        }
