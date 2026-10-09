"""
email.py

Email delivery utility for OTP verification.
Supports standard SMTP (e.g. Gmail App Password) and OTP_DEV_MODE for local testing.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from starlette.concurrency import run_in_threadpool

from app.config import settings

logger = logging.getLogger(__name__)


def _send_smtp_email_sync(to_email: str, otp: str) -> None:
    message = MIMEMultipart("alternative")
    message["Subject"] = "SkillBridge - Your Registration OTP"
    message["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    message["To"] = to_email

    text_content = f"Your SkillBridge verification OTP code is: {otp}\nThis code will expire in 10 minutes."
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to SkillBridge!</h2>
        <p>Use the following 6-digit One-Time Password (OTP) to complete your registration:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4F46E5;">{otp}</p>
        <p>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
      </body>
    </html>
    """

    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))

    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)


async def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send registration verification OTP.
    In OTP_DEV_MODE, logs/prints OTP to server console and skips external SMTP.
    Returns True on success, False if sending fails.
    """
    if settings.OTP_DEV_MODE:
        # Dev mode only: print OTP to console
        print(f"\n==========================================")
        print(f"[OTP_DEV_MODE] Verification OTP for {to_email}: {otp}")
        print(f"==========================================\n")
        logger.info(f"[OTP_DEV_MODE] Generated OTP for {to_email}: {otp}")
        return True

    try:
        await run_in_threadpool(_send_smtp_email_sync, to_email, otp)
        logger.info(f"Verification OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False
