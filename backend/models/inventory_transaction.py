from datetime import datetime
from config.database import db


class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    quantity_change = db.Column(db.Integer, nullable=False)
    note = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    item = db.relationship('InventoryItem', backref='transactions')

    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'quantity_change': self.quantity_change,
            'note': self.note,
            'created_at': self.created_at.isoformat(),
        }
