from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from config.database import db
from models.inventory import InventoryItem
from models.inventory_transaction import InventoryTransaction
from utils.auth import role_required
from models.notification import Notification
from models.user import User
from flask import current_app

inventory_bp = Blueprint('inventory', __name__)


def record_inventory_transaction(item, quantity_change, note=None):
    transaction = InventoryTransaction(
        item_id=item.id,
        quantity_change=quantity_change,
        note=note,
    )
    db.session.add(transaction)


@inventory_bp.route('/', methods=['GET'])
@jwt_required()
def inventory_list():
    items = InventoryItem.query.order_by(InventoryItem.name.asc()).all()
    return jsonify({'inventory': [item.to_dict() for item in items]})


@inventory_bp.route('/', methods=['POST'])
@role_required(['admin'])
def add_inventory_item():
    data = request.get_json() or {}
    try:
        # enforce unique SKU if provided
        sku = data.get('sku')
        if sku:
            existing = InventoryItem.query.filter_by(sku=sku).first()
            if existing:
                return jsonify({'error': 'SKU already exists', 'details': f"SKU '{sku}' is already used"}), 409
        item = InventoryItem(
            name=data.get('name'),
            sku=data.get('sku'),
            description=data.get('description'),
            quantity=int(data.get('quantity', 0) or 0),
            threshold=int(data.get('threshold', 5) or 5),
            supplier=data.get('supplier'),
            cost=float(data.get('cost', 0) or 0),
        )
        db.session.add(item)
        db.session.flush()
        record_inventory_transaction(item, item.quantity, 'Initial stock added')
        # create low-stock notification if below threshold
        if item.quantity <= item.threshold:
            note = Notification(user_id=None, title='Low stock alert', message=f"Low stock for '{item.name}': {item.quantity} remaining")
            db.session.add(note)
        db.session.commit()
        return jsonify({'message': 'Inventory item added', 'item': item.to_dict()}), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Unable to add inventory item', 'details': str(err)}), 400


@inventory_bp.route('/<int:item_id>', methods=['PUT'])
@role_required(['admin'])
def update_inventory_item(item_id):
    data = request.get_json() or {}
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Inventory item not found'}), 404
    try:
        # ensure SKU uniqueness when changing SKU
        new_sku = data.get('sku')
        if new_sku and new_sku != item.sku:
            if InventoryItem.query.filter_by(sku=new_sku).first():
                return jsonify({'error': 'SKU already exists', 'details': f"SKU '{new_sku}' is already used"}), 409
        quantity_change = None
        if 'quantity' in data:
            new_qty = int(data.get('quantity', item.quantity) or item.quantity)
            quantity_change = new_qty - item.quantity
            item.quantity = new_qty
        item.name = data.get('name', item.name)
        item.sku = data.get('sku', item.sku)
        item.description = data.get('description', item.description)
        item.threshold = int(data.get('threshold', item.threshold) or item.threshold)
        item.supplier = data.get('supplier', item.supplier)
        item.cost = float(data.get('cost', item.cost) or item.cost)
        if quantity_change is not None and quantity_change != 0:
            record_inventory_transaction(item, quantity_change, data.get('note', 'Quantity adjusted'))
        # if quantity falls below threshold, create notification and optionally email admins
        if item.quantity <= item.threshold:
            note = Notification(user_id=None, title='Low stock alert', message=f"Low stock for '{item.name}': {item.quantity} remaining")
            db.session.add(note)
            # attempt to email admins if mail is configured
            try:
                admins = User.query.filter_by(role='admin').all()
                emails = [a.email for a in admins if a.email]
                if emails and current_app.extensions.get('mail'):
                    from flask_mail import Message
                    msg = Message(subject='Low stock alert', recipients=emails, body=note.message)
                    current_app.extensions['mail'].send(msg)
            except Exception:
                pass
        db.session.commit()
        return jsonify({'message': 'Inventory item updated', 'item': item.to_dict()})
    except Exception as err:
        db.session.rollback()
        return jsonify({'error': 'Unable to update inventory item', 'details': str(err)}), 400


@inventory_bp.route('/<int:item_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_inventory_item(item_id):
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Inventory item not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Inventory item removed'}), 200


@inventory_bp.route('/transactions', methods=['GET'])
@jwt_required()
def inventory_transactions():
    transactions = InventoryTransaction.query.order_by(InventoryTransaction.created_at.desc()).all()
    return jsonify({'transactions': [txn.to_dict() for txn in transactions]})


@inventory_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def low_stock_alerts():
    items = InventoryItem.query.filter(InventoryItem.quantity <= InventoryItem.threshold).all()
    return jsonify({'alerts': [item.to_dict() for item in items]})
