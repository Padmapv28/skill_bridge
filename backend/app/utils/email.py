"""
Email delivery for SkillBridge registration OTP and welcome messages.

For inbox delivery, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
EMAIL_FROM in backend/.env and set OTP_DEV_MODE=False.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from starlette.concurrency import run_in_threadpool

from app.config import settings

logger = logging.getLogger(__name__)


def _send_smtp_message_sync(to_email: str, subject: str, text_content: str, html_content: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD in backend/.env.")

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    message["To"] = to_email
    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))

    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)


async def send_otp_email(to_email: str, otp: str) -> bool:
    """Send the verification OTP; return False if SMTP delivery fails."""
    if settings.OTP_DEV_MODE:
        # Explicit local development mode only; no email is sent in this mode.
        print("\n[OTP_DEV_MODE] Email delivery is disabled; verification code for", to_email, ":", otp, "\n")
        logger.warning("OTP_DEV_MODE=True: verification email skipped for %s; set OTP_DEV_MODE=False for inbox delivery.", to_email)
        return True

    text_content = (
        f"Your SkillBridge verification code is: {otp}\n\n"
        "This code expires in 10 minutes. If you did not request this code, you can ignore this email."
    )
    html_content = f"""
    <html><body style="font-family:Arial,sans-serif;color:#243044;line-height:1.6">
      <div style="max-width:560px;margin:24px auto;padding:28px;border:1px solid #e2e8f0;border-radius:14px">
        <h2 style="color:#4f46e5;margin-top:0">Welcome to SkillBridge</h2>
        <p>Use this six-digit verification code to finish creating your account:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:7px;color:#4f46e5">{escape(otp)}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="font-size:13px;color:#64748b">If you did not request this code, you can safely ignore this email.</p>
      </div>
    </body></html>
    """
    try:
        await run_in_threadpool(
            _send_smtp_message_sync,
            to_email,
            "SkillBridge — Your verification code",
            text_content,
            html_content,
        )
        logger.info("Verification email sent successfully to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
        return False


async def send_welcome_email(to_email: str, name: str = "") -> bool:
    """Send a welcome email after OTP verification; failures do not affect registration."""
    if settings.OTP_DEV_MODE:
        logger.info("Welcome email skipped because OTP_DEV_MODE=True for %s", to_email)
        return False

    safe_name = escape((name or "there").strip() or "there")
    text_content = (
        f"Hi {name.strip() or 'there'},\n\n"
        "Registration successful! Thank you for registering with SkillBridge. "
        "Your email has been verified and your account is ready to use.\n\n"
        "You can now sign in and continue your career journey with SkillBridge.\n\n"
        "Thank you,\nSkillBridge Team"
    )
    html_content = f"""
    <html><body style="font-family:Arial,sans-serif;color:#243044;line-height:1.6">
      <div style="max-width:560px;margin:24px auto;padding:28px;border:1px solid #e2e8f0;border-radius:14px">
        <h2 style="color:#4f46e5;margin-top:0">Registration successful!</h2>
        <p>Hi {safe_name},</p>
        <p>Thank you for registering with <strong>SkillBridge</strong>. Your email has been verified and your account is ready to use.</p>
        <p>You can now sign in and continue your career journey with SkillBridge.</p>
        <p>Thank you,<br><strong>SkillBridge Team</strong></p>
      </div>
    </body></html>
    """
    try:
        await run_in_threadpool(
            _send_smtp_message_sync,
            to_email,
            "Welcome to SkillBridge — registration successful",
            text_content,
            html_content,
        )
        logger.info("Welcome email sent successfully to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send welcome email to %s", to_email)
        return False
