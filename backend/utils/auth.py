from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt


def get_jwt_user():
    identity = get_jwt_identity()
    claims = get_jwt()
    return {
        'id': int(identity) if identity is not None else None,
        'role': claims.get('role'),
        'email': claims.get('email'),
    }


def role_required(roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_user()
            if not identity or identity.get('role') not in roles:
                return jsonify({'error': 'Access denied'}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator
