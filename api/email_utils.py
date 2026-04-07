"""
SMTP OTP delivery. Set variables in backend/.env (see .env.example).
"""
import logging
import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

# Use absolute path so SMTP settings load reliably under uvicorn / reload workers.
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_ENV_PATH, override=True)

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def send_otp_email(to_email: str, code: str) -> bool:
    """Send 6-digit OTP to the user. Returns True if sent, False on failure or missing config."""
    if not smtp_configured():
        logger.warning("SMTP not configured; set SMTP_HOST, SMTP_USER, SMTP_PASS in .env")
        return False

    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "")
    # Must be a valid email address; Mailtrap username alone is NOT a valid From.
    mail_from = os.getenv("SMTP_FROM", "").strip()
    if not mail_from or "@" not in mail_from:
        mail_from = "noreply@example.com"
    from_name = os.getenv("FROM_NAME", "Global AI Skill Challenge").strip()

    msg = EmailMessage()
    msg["Subject"] = "Your verification code"
    msg["From"] = f"{from_name} <{mail_from}>"
    msg["To"] = to_email
    msg.set_content(
        f"Your verification code is: {code}\n\n"
        "If you did not request this, you can ignore this email."
    )

    try:
        with smtplib.SMTP(host, port, timeout=30) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as e:
        logger.exception("Failed to send OTP email: %s", e)
        return False
