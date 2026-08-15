import os
import pymysql

host = os.getenv('MYSQL_HOST', 'localhost')
port = int(os.getenv('MYSQL_PORT', 3306))
user = os.getenv('MYSQL_USER', 'root')
password = os.getenv('MYSQL_PASSWORD', '')
dbname = os.getenv('MYSQL_DB', 'salon_app')

conn = pymysql.connect(host=host, port=port, user=user, password=password, database=dbname)
try:
    with conn.cursor() as cur:
        cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME='users'", (dbname,))
        existing = {r[0] for r in cur.fetchall()}
        print('Existing columns:', existing)
        to_add = []
        if 'profile_picture_url' not in existing:
            to_add.append("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255) NULL")
        if 'loyalty_points' not in existing:
            to_add.append("ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0")
        if 'password_reset_token' not in existing:
            to_add.append("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(120) NULL")
        if 'password_reset_expires' not in existing:
            to_add.append("ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL")

        for stmt in to_add:
            try:
                print('Executing:', stmt)
                cur.execute(stmt)
                conn.commit()
                print('OK')
            except Exception as e:
                print('Error executing', stmt, e)
finally:
    conn.close()
print('Done')
