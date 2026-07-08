import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from config.database import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    engine = db.engine
    def has(col):
        try:
            res = engine.execute(text("SHOW COLUMNS FROM users LIKE :col"), {'col': col})
            return res.fetchone() is not None
        except Exception as e:
            print('SHOW COLUMNS ERROR for', col, '->', e)
            return False

    cols = ['profile_picture_url','loyalty_points','password_reset_token','password_reset_expires']
    for c in cols:
        print(c, 'exists?', has(c))

    stmts = [
        "ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255) NULL",
        "ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0",
        "ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(120) NULL",
        "ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL",
    ]

    for s in stmts:
        try:
            print('RUN:', s)
            engine.execute(text(s))
            print('OK')
        except Exception as e:
            print('ERR on:', s, '->', repr(e))

    for c in cols:
        print(c, 'now exists?', has(c))
    print('DONE')
