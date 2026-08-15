"""
Security utilities for password validation, sanitization, and other security checks
"""
import re
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt


class PasswordValidator:
    """Validate password strength and security requirements"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 255
    
    @staticmethod
    def validate(password: str) -> tuple[bool, str]:
        """
        Validate password strength
        Returns: (is_valid, error_message)
        """
        if not password:
            return False, "Password is required"
        
        if len(password) < PasswordValidator.MIN_LENGTH:
            return False, f"Password must be at least {PasswordValidator.MIN_LENGTH} characters"
        
        if len(password) > PasswordValidator.MAX_LENGTH:
            return False, f"Password must not exceed {PasswordValidator.MAX_LENGTH} characters"
        
        # Optional: Require at least one uppercase, one lowercase, one digit, one special char
        # Uncomment for stricter validation:
        # has_upper = any(c.isupper() for c in password)
        # has_lower = any(c.islower() for c in password)
        # has_digit = any(c.isdigit() for c in password)
        # has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
        # 
        # if not (has_upper and has_lower and has_digit and has_special):
        #     return False, "Password must contain uppercase, lowercase, digit, and special character"
        
        return True, ""


class InputValidator:
    """Validate user inputs to prevent injection attacks"""
    
    @staticmethod
    def validate_email(email: str) -> tuple[bool, str]:
        """Validate email format"""
        if not email or not isinstance(email, str):
            return False, "Invalid email"
        
        email = email.strip()
        if len(email) > 254:
            return False, "Email is too long"
        
        # RFC 5322 simplified email regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Invalid email format"
        
        return True, ""
    
    @staticmethod
    def validate_username(username: str) -> tuple[bool, str]:
        """Validate username format"""
        if not username or not isinstance(username, str):
            return False, "Invalid username"
        
        username = username.strip()
        if len(username) < 3:
            return False, "Username must be at least 3 characters"
        
        if len(username) > 80:
            return False, "Username must not exceed 80 characters"
        
        # Allow alphanumeric, underscore, dash only
        pattern = r'^[a-zA-Z0-9_-]+$'
        if not re.match(pattern, username):
            return False, "Username can only contain letters, numbers, underscore, and dash"
        
        return True, ""
    
    @staticmethod
    def validate_full_name(name: str) -> tuple[bool, str]:
        """Validate full name"""
        if not name or not isinstance(name, str):
            return False, "Invalid name"
        
        name = name.strip()
        if len(name) < 2:
            return False, "Name must be at least 2 characters"
        
        if len(name) > 120:
            return False, "Name must not exceed 120 characters"
        
        # Allow letters, spaces, hyphens, apostrophes
        pattern = r"^[a-zA-Z\s\-']+$"
        if not re.match(pattern, name):
            return False, "Name contains invalid characters"
        
        return True, ""


class SanitationHelper:
    """Sanitize user inputs"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitize string input"""
        if not value:
            return ""
        
        if not isinstance(value, str):
            return ""
        
        # Strip whitespace
        value = value.strip()
        
        # Limit length
        if len(value) > max_length:
            value = value[:max_length]
        
        return value


def require_json(f):
    """Decorator to ensure request is JSON"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        return f(*args, **kwargs)
    return decorated_function


def prevent_token_in_response(f):
    """
    Decorator to remind developers not to expose sensitive tokens in responses
    This is a development helper
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # This is a development reminder - actual implementation should be in the route
        return f(*args, **kwargs)
    return decorated_function
