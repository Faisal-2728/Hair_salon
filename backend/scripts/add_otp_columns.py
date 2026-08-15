#!/usr/bin/env python3
"""
Migration script to add OTP verification columns to users table
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config.database import db
from sqlalchemy import text

def add_otp_columns():
    """Add OTP columns to users table if they don't exist"""
    app = create_app()
    
    with app.app_context():
        try:
            from models.user import User
            inspector = db.inspect(db.engine)
            columns = [c['name'] for c in inspector.get_columns('users')]

            if 'email_verification_otp' not in columns:
                print("Adding email_verification_otp column...")
                with db.engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_otp VARCHAR(6) NULL"))
                print("✓ Added email_verification_otp column")

            if 'email_otp_expires' not in columns:
                print("Adding email_otp_expires column...")
                with db.engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_otp_expires DATETIME NULL"))
                print("✓ Added email_otp_expires column")

            print("\n✓ Migration completed successfully!")

        except Exception as e:
            print(f"✗ Migration failed: {str(e)}")
            return False

    return True


if __name__ == '__main__':
    success = add_otp_columns()
    sys.exit(0 if success else 1)
