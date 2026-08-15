import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db_migrations import ensure_user_columns
from app import create_app

app = create_app()
with app.app_context():
    ensure_user_columns()
    print('MIGRATIONS_DONE')
