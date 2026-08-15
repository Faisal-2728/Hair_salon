#!/usr/bin/env python3
"""
Script to create or recover admin account
Usage: python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash
from app import create_app
from config.database import db
from models.user import User


def create_admin_account(username='admin', email='admin@salon.local', password='Admin123!', full_name='Administrator'):
    """Create or update admin account"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if admin exists
            existing = User.query.filter_by(username=username).first()
            
            if existing:
                print(f"✓ Admin account '{username}' already exists")
                print(f"  - Email: {existing.email}")
                print(f"  - Name: {existing.full_name}")
                print(f"  - Role: {existing.role}")
                print(f"  - Verified: {existing.verified}")
                print(f"  - Active: {existing.is_active}")
                
                response = input("\nDo you want to update the password? (y/n): ").strip().lower()
                if response == 'y':
                    new_password = input("Enter new password (min 8 chars): ").strip()
                    if len(new_password) < 8:
                        print("✗ Password too short")
                        return False
                    existing.set_password(new_password)
                    db.session.commit()
                    print("✓ Password updated successfully")
                    return True
                return False
            
            # Create new admin
            admin = User(
                username=username,
                email=email,
                full_name=full_name,
                role='admin',
                verified=True,
            )
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            
            print("✓ Admin account created successfully!")
            print(f"  - Username: {username}")
            print(f"  - Email: {email}")
            print(f"  - Name: {full_name}")
            print(f"  - Password: {password}")
            print("\n⚠️  Change password after first login!")
            
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            db.session.rollback()
            return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Create or recover admin account')
    parser.add_argument('--username', default='admin', help='Username (default: admin)')
    parser.add_argument('--email', default='admin@salon.local', help='Email (default: admin@salon.local)')
    parser.add_argument('--password', default='Admin123!', help='Password (default: Admin123!)')
    parser.add_argument('--name', default='Administrator', help='Full name (default: Administrator)')
    parser.add_argument('--print-hash', action='store_true', help='Print password hash without creating account')
    
    args = parser.parse_args()
    
    if args.print_hash:
        # Just print the hash
        hash_value = generate_password_hash(args.password)
        print("\nSQL Query to insert admin account:")
        print("=" * 80)
        print(f"""
INSERT INTO users (username, email, password_hash, full_name, role, verified, is_active, created_at, updated_at)
VALUES (
    '{args.username}',
    '{args.email}',
    '{hash_value}',
    '{args.name}',
    'admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
);
        """.strip())
        print("=" * 80)
    else:
        # Create the account
        success = create_admin_account(
            username=args.username,
            email=args.email,
            password=args.password,
            full_name=args.name
        )
        sys.exit(0 if success else 1)
