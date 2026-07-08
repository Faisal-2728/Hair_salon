import sys
import os

# ensure project root is on sys.path when running from scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from config.database import db
from models.user import User

app = create_app()
with app.app_context():
    print('DB:', app.config.get('SQLALCHEMY_DATABASE_URI'))
    users = User.query.all()
    print('USERS:', [u.username for u in users])
