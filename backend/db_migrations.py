from sqlalchemy import text
from config.database import db


def ensure_user_columns():
    """Add missing user columns for older schemas.

    This is a minimal, idempotent migration helper used in development
    to add new nullable columns that may be missing from the `users`
    table so the app can start without a full migration system.
    """
    engine = db.engine
    inspector = None
    try:
        inspector = engine.dialect.get_inspector(engine)
    except Exception:
        # fallback: use information_schema queries
        inspector = None

    def column_exists(column_name):
        try:
            with engine.connect() as conn:
                res = conn.execute(text("SHOW COLUMNS FROM users LIKE :col"), {'col': column_name})
                row = res.fetchone()
                return row is not None
        except Exception:
            return False

    statements = []
    if not column_exists('verified'):
        statements.append("ALTER TABLE users ADD COLUMN verified TINYINT(1) DEFAULT 0")
    if not column_exists('is_active'):
        statements.append("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1")
    if not column_exists('email_verification_otp'):
        statements.append("ALTER TABLE users ADD COLUMN email_verification_otp VARCHAR(6) NULL")
    if not column_exists('email_otp_expires'):
        statements.append("ALTER TABLE users ADD COLUMN email_otp_expires DATETIME NULL")
    if not column_exists('profile_picture_url'):
        statements.append("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255) NULL")
    if not column_exists('loyalty_points'):
        statements.append("ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0")
    if not column_exists('password_reset_token'):
        statements.append("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(120) NULL")
    if not column_exists('password_reset_expires'):
        statements.append("ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL")
    if not column_exists('password_reset_code'):
        statements.append("ALTER TABLE users ADD COLUMN password_reset_code VARCHAR(6) NULL")

    for stmt in statements:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception:
            # ignore failures in best-effort migrations
            pass
