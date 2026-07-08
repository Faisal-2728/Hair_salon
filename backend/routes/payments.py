from io import BytesIO
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth import get_jwt_user
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from config.database import db
from models.transaction import Transaction

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def payment_history():
    identity = get_jwt_user()
    payments = Transaction.query.filter_by(user_id=identity['id']).order_by(Transaction.created_at.desc()).all()
    return jsonify({'payments': [payment.to_dict() for payment in payments]})


@payments_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    identity = get_jwt_user()
    data = request.get_json() or {}
    payment = Transaction(
        user_id=identity['id'],
        appointment_id=data.get('appointment_id'),
        amount=data.get('amount', 0),
        currency=data.get('currency', 'USD'),
        payment_method=data.get('payment_method', 'online'),
        status='completed',
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({'message': 'Payment processed', 'transaction': payment.to_dict()})


@payments_bp.route('/invoice/<int:payment_id>', methods=['GET'])
@jwt_required()
def invoice(payment_id):
    payment = Transaction.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont('Helvetica-Bold', 16)
    p.drawString(40, 720, 'Salon Invoice')
    p.setFont('Helvetica', 12)
    p.drawString(40, 690, f'Invoice ID: {payment.id}')
    p.drawString(40, 670, f'User ID: {payment.user_id}')
    p.drawString(40, 650, f'Amount: {payment.amount} {payment.currency}')
    p.drawString(40, 630, f'Payment Method: {payment.payment_method}')
    p.drawString(40, 610, f'Status: {payment.status}')
    p.drawString(40, 590, f'Date: {payment.created_at.isoformat()}')
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, download_name=f'invoice_{payment.id}.pdf', as_attachment=True, mimetype='application/pdf')
