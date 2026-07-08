import os
from flask import Blueprint, jsonify, request, current_app, url_for
from werkzeug.utils import secure_filename
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from config.database import db
from models.service import Service
from utils.auth import role_required

services_bp = Blueprint('services', __name__)


def _get_request_data():
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        return request.form.to_dict()
    return request.get_json() or {}


def _parse_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return default


def _save_image_file(image_file):
    if not image_file or image_file.filename == '':
        return None
    # basic validation: extension and size (max 5MB)
    allowed_ext = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    filename = secure_filename(image_file.filename)
    if not filename:
        return None
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in allowed_ext:
        return None
    upload_dir = os.path.join(current_app.root_path, 'static', 'services')
    os.makedirs(upload_dir, exist_ok=True)
    # unique filename to avoid collisions
    import uuid
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, unique_name)
    # limit size: read stream to check (do not load huge files)
    try:
        image_file.seek(0, 2)
        size = image_file.tell()
        image_file.seek(0)
    except Exception:
        size = None
    if size and size > 5 * 1024 * 1024:
        return None
    image_file.save(filepath)
    return url_for('static', filename=f'services/{unique_name}', _external=True)


@services_bp.route('/', methods=['GET'])
def get_services():
    search = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    query = Service.query.filter_by(active=True)
    if search:
        query = query.filter(or_(Service.name.ilike(f'%{search}%'), Service.category.ilike(f'%{search}%')))
    total = query.count()
    services = query.order_by(Service.name.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        'services': [service.to_dict() for service in services],
        'page': page,
        'total_pages': (total + per_page - 1) // per_page,
        'total': total,
    })


@services_bp.route('/', methods=['POST'])
@role_required(['admin'])
def create_service():
    data = _get_request_data()
    
    # Validation
    errors = []
    name = (data.get('name') or '').strip()
    category = (data.get('category') or '').strip()
    description = (data.get('description') or '').strip()
    price_str = str(data.get('price') or '0').strip()
    duration_str = str(data.get('duration_minutes') or '30').strip()
    
    if not name:
        errors.append('Service name is required')
    elif len(name) > 140:
        errors.append('Service name must be 140 characters or less')
    
    if not category:
        errors.append('Service category is required')
    elif len(category) > 120:
        errors.append('Service category must be 120 characters or less')
    
    try:
        price = float(price_str) if price_str else 0.0
        if price < 0:
            errors.append('Price cannot be negative')
    except (ValueError, TypeError):
        errors.append('Price must be a valid number')
    
    try:
        duration_minutes = int(duration_str) if duration_str else 30
        if duration_minutes < 5:
            errors.append('Duration must be at least 5 minutes')
        elif duration_minutes > 480:
            errors.append('Duration cannot exceed 8 hours')
    except (ValueError, TypeError):
        errors.append('Duration must be a valid integer')
    
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400
    
    image_url = None
    if 'image_file' in request.files:
        image_url = _save_image_file(request.files['image_file'])

    try:
        service = Service(
            name=name,
            category=category,
            description=description or None,
            price=price,
            duration_minutes=duration_minutes,
            image_url=image_url or data.get('image_url') or None,
            active=_parse_bool(data.get('active', True)),
        )
        db.session.add(service)
        db.session.commit()
        return jsonify({'message': 'Service created successfully', 'service': service.to_dict()}), 201
    except SQLAlchemyError as err:
        db.session.rollback()
        current_app.logger.error(f"Database error creating service: {str(err)}")
        return jsonify({'error': 'Unable to create service', 'details': 'A database error occurred. Please try again.'}), 400
    except Exception as err:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error creating service: {str(err)}")
        return jsonify({'error': 'Unable to create service', 'details': 'An unexpected error occurred.'}), 400


@services_bp.route('/<int:service_id>', methods=['PUT'])
@role_required(['admin'])
def update_service(service_id):
    data = _get_request_data()
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    # Validation for optional fields
    errors = []
    name = (data.get('name') or service.name or '').strip()
    category = (data.get('category') or service.category or '').strip()
    
    if name and len(name) > 140:
        errors.append('Service name must be 140 characters or less')
    
    if category and len(category) > 120:
        errors.append('Service category must be 120 characters or less')
    
    if 'price' in data:
        try:
            price_val = float(data.get('price') or service.price)
            if price_val < 0:
                errors.append('Price cannot be negative')
        except (ValueError, TypeError):
            errors.append('Price must be a valid number')
    
    if 'duration_minutes' in data:
        try:
            duration_val = int(data.get('duration_minutes') or service.duration_minutes)
            if duration_val < 5:
                errors.append('Duration must be at least 5 minutes')
            elif duration_val > 480:
                errors.append('Duration cannot exceed 8 hours')
        except (ValueError, TypeError):
            errors.append('Duration must be a valid integer')
    
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    if 'image_file' in request.files:
        image_url = _save_image_file(request.files['image_file'])
        if image_url:
            service.image_url = image_url
    elif 'image_url' in data:
        service.image_url = data.get('image_url') or service.image_url

    try:
        service.name = data.get('name', service.name)
        service.category = data.get('category', service.category)
        service.description = data.get('description', service.description)
        service.price = float(data.get('price', service.price) or service.price)
        service.duration_minutes = int(data.get('duration_minutes', service.duration_minutes) or service.duration_minutes)
        service.active = _parse_bool(data.get('active', service.active))
        db.session.commit()
        return jsonify({'message': 'Service updated successfully', 'service': service.to_dict()}), 200
    except SQLAlchemyError as err:
        db.session.rollback()
        current_app.logger.error(f"Database error updating service: {str(err)}")
        return jsonify({'error': 'Unable to update service', 'details': 'A database error occurred.'}), 400
    except Exception as err:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error updating service: {str(err)}")
        return jsonify({'error': 'Unable to update service', 'details': 'An unexpected error occurred.'}), 400


@services_bp.route('/<int:service_id>', methods=['DELETE'])
@role_required(['admin'])
def delete_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    service.active = False
    db.session.commit()
    return jsonify({'message': 'Service archived successfully'})
