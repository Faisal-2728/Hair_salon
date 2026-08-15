from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth import get_jwt_user
from config.database import db
from models.review import Review
from models.service import Service
from models.user import User
from utils.auth import role_required

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('/service/<int:service_id>', methods=['GET'])
@jwt_required()
def get_service_reviews(service_id):
    reviews = Review.query.filter_by(service_id=service_id).order_by(Review.created_at.desc()).all()
    service = Service.query.get(service_id)
    rating_values = [review.rating for review in reviews]
    average_rating = float(sum(rating_values) / len(rating_values)) if rating_values else None
    return jsonify({
        'service': service.to_dict() if service else None,
        'average_rating': average_rating,
        'reviews': [review.to_dict() for review in reviews],
    })


@reviews_bp.route('/appointment/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment_review(appointment_id):
    review = Review.query.filter_by(appointment_id=appointment_id).first()
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    return jsonify({'review': review.to_dict()})


@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    identity = get_jwt_user()
    data = request.get_json() or {}
    rating = data.get('rating')
    service_id = data.get('service_id')
    if not service_id or not rating:
        return jsonify({'error': 'Service and rating are required'}), 400
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({'error': 'Rating must be a number'}), 400
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    review = Review(
        user_id=identity['id'],
        service_id=service_id,
        appointment_id=data.get('appointment_id'),
        rating=rating,
        comment=data.get('comment'),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review submitted', 'review': review.to_dict()}), 201


@reviews_bp.route('/public', methods=['GET'])
def public_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    review_payload = []
    for review in reviews:
        payload = review.to_dict()
        user = User.query.get(review.user_id)
        payload['user'] = user.to_dict() if user else None
        review_payload.append(payload)
    return jsonify({'reviews': review_payload})


@reviews_bp.route('/all', methods=['GET'])
@role_required(['admin'])
def list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify({'reviews': [review.to_dict() for review in reviews]})
