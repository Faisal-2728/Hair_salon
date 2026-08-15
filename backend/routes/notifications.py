from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    payload = request.get_json() or {}
    if current_app.extensions.get('mail'):
        msg = Message(subject=payload.get('subject', 'Notification'), recipients=[payload.get('email')], body=payload.get('message', ''))
        current_app.extensions['mail'].send(msg)
    return jsonify({'message': 'Notification queued', 'payload': payload})


@notifications_bp.route('/reminders', methods=['GET'])
@jwt_required()
def reminders():
    today = datetime.utcnow().date()
    return jsonify({'reminders': []})
