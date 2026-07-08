import os
import socket
import pymysql
from datetime import timedelta
from dotenv import find_dotenv, load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOTENV_PATH = os.path.join(BASE_DIR, '.env')
if not os.path.exists(DOTENV_PATH):
    DOTENV_PATH = find_dotenv(usecwd=True)
load_dotenv(DOTENV_PATH)


def mysql_is_reachable(host: str, port: int = 3306, user: str | None = None, password: str = '', timeout: float = 2.0) -> bool:
    try:
        if user:
            connection = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                connect_timeout=timeout,
            )
            connection.close()
        else:
            with socket.create_connection((host, port), timeout=timeout):
                pass
        return True
    except Exception:
        return False


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me').strip() or 'change-me'

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        mysql_host = os.getenv('MYSQL_HOST')
        mysql_port = int(os.getenv('MYSQL_PORT', 3306))
        mysql_db = os.getenv('MYSQL_DB')
        mysql_user = os.getenv('MYSQL_USER')
        mysql_password = os.getenv('MYSQL_PASSWORD', '')

        if mysql_host and mysql_db and mysql_user:
            if mysql_password:
                auth_part = f"{mysql_user}:{mysql_password}"
            else:
                auth_part = mysql_user

            mysql_url = (
                f"mysql+pymysql://{auth_part}@{mysql_host}:{mysql_port}/{mysql_db}"
            )
            if mysql_is_reachable(mysql_host, port=mysql_port, user=mysql_user, password=mysql_password):
                database_url = mysql_url
            else:
                print(
                    f"WARNING: MySQL not reachable at {mysql_host}:{mysql_port}. "
                    "Falling back to SQLite for local development. "
                    "Start MySQL or set DATABASE_URL to use MySQL."
                )
                database_url = 'sqlite:///salon_app.db'
        else:
            database_url = 'sqlite:///salon_app.db'

    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-me').strip() or 'change-me'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=6)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com').strip()
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '').strip()
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '').strip()
    MAIL_USE_TLS = _env_flag('MAIL_USE_TLS', True)
    MAIL_USE_SSL = _env_flag('MAIL_USE_SSL', False)
    MAIL_DEFAULT_SENDER = (os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('MAIL_USERNAME') or 'no-reply@salonapp.local').strip()
    MAIL_DEBUG = _env_flag('MAIL_DEBUG', False)
    MAIL_SUPPRESS_SEND = _env_flag('MAIL_SUPPRESS_SEND', False)
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').strip()
