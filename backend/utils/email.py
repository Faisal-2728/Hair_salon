import logging
import socket
import threading
from flask import current_app
from flask_mail import Mail, Message
from smtplib import SMTPAuthenticationError, SMTPException

logger = logging.getLogger(__name__)
mail = Mail()


def _send_message(app, message):
    with app.app_context():
        try:
            mail.send(message)
            logger.info('Email sent successfully to %s subject=%s', message.recipients, message.subject)
        except SMTPAuthenticationError as exc:
            logger.exception('SMTP authentication failed sending email to %s: %s', message.recipients, exc)
        except (socket.timeout, TimeoutError) as exc:
            logger.exception('Email connection timeout sending email to %s: %s', message.recipients, exc)
        except SMTPException as exc:
            logger.exception('SMTP error sending email to %s: %s', message.recipients, exc)
        except Exception as exc:
            logger.exception('Unexpected email error sending email to %s: %s', message.recipients, exc)


def send_email(to_address: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    cfg = current_app.config
    sender = (cfg.get('MAIL_DEFAULT_SENDER') or cfg.get('MAIL_USERNAME') or '').strip()
    server = (cfg.get('MAIL_SERVER') or '').strip()
    username = (cfg.get('MAIL_USERNAME') or '').strip()
    password = (cfg.get('MAIL_PASSWORD') or '').strip()

    if not to_address or '@' not in to_address or len(to_address) > 254:
        logger.warning('Invalid recipient address: %s', to_address)
        return False

    if not server:
        logger.warning('MAIL_SERVER is not configured. Email was not sent to %s.', to_address)
        return False

    if not username or not password:
        logger.warning('MAIL_USERNAME or MAIL_PASSWORD is not configured. Email was not sent to %s.', to_address)
        return False

    if not sender:
        logger.warning('MAIL_DEFAULT_SENDER is not configured. Email was not sent to %s.', to_address)
        return False

    try:
        message = Message(
            subject=subject,
            sender=sender,
            recipients=[to_address],
            body=text_body or '',
            html=html_body,
        )
        app = current_app._get_current_object()
        thread = threading.Thread(target=_send_message, args=(app, message), daemon=True)
        thread.start()
        logger.info('Queued email to %s subject=%s', to_address, subject)
        return True
    except Exception as exc:
        logger.exception('Failed to start email thread for %s: %s', to_address, exc)
        return False
