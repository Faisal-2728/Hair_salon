import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config.settings import Config
from config.database import db
from utils.email import mail

socketio = SocketIO(cors_allowed_origins='*')
from routes.auth import auth_bp
from routes.customer import customer_bp
from routes.admin import admin_bp
from routes.staff import staff_bp
from routes.services import services_bp
from routes.appointments import appointments_bp
from routes.inventory import inventory_bp
from routes.payments import payments_bp
from routes.notifications import notifications_bp
from routes.analytics import analytics_bp
from routes.reviews import reviews_bp

# Import all models so SQLAlchemy metadata is populated before create_all()
from models import User, Service, Appointment, InventoryItem, Transaction, Branch, Review, InventoryTransaction


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False
    # Log the configured database URL (mask password for safety)
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    masked = db_uri
    try:
        if '://' in db_uri and '@' in db_uri:
            parts = db_uri.split('://', 1)
            scheme = parts[0]
            rest = parts[1]
            if '@' in rest:
                auth, host = rest.split('@', 1)
                if ':' in auth:
                    user, pwd = auth.split(':', 1)
                    masked = f"{scheme}://{user}:****@{host}"
    except Exception:
        masked = db_uri
    print(f"Database configured: {masked}")
    cors_origins = app.config.get('CORS_ORIGINS', ['*'])
    if isinstance(cors_origins, str):
        cors_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    # Basic rate limiting to protect public endpoints
    limiter = Limiter(key_func=get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

    db.init_app(app)
    # Initialize JWT manager and blocklist support
    from flask_jwt_extended import JWTManager as _JWTManager
    jwt = _JWTManager(app)
    # simple in-memory blocklist for revoked tokens (dev only)
    app.config.setdefault('JWT_BLOCKLIST', set())

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        return jti in app.config.get('JWT_BLOCKLIST', set())
    mail.init_app(app)
    socketio.init_app(app)

    limiter.exempt(auth_bp)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(customer_bp, url_prefix='/api/customer')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(staff_bp, url_prefix='/api/staff')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    @app.route('/')
    def home():
        return jsonify({'message': 'Hair Salon Management API is running'})

    with app.app_context():
        db.create_all()
        try:
            from seed import seed_data
            seed_data()
        except Exception:
            pass
        try:
            from db_migrations import ensure_user_columns
            ensure_user_columns()
        except Exception:
            pass

    return app


app = create_app()


@socketio.on('connect')
def handle_connect():
    print('Socket connected')


@socketio.on('notification')
def handle_notification(data):
    socketio.emit('notification', data)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)
