import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from config.database import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    engine = db.engine
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SHOW COLUMNS FROM users"))
            cols = [r[0] for r in res.fetchall()]
            print('COLUMNS:', cols)
    except Exception as e:
        print('ERROR:', e)
