"""
email.py

Email delivery utility for SkillBridge.
Supports:
1. Registration Verification OTP
2. Registration Success confirmation
3. ATS Match Score Report delivery
4. Course Registration confirmation

Works with Gmail SMTP (App Password) and gracefully falls back to console output
if SMTP credentials are not yet configured or fail.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from starlette.concurrency import run_in_threadpool

from app.config import settings

logger = logging.getLogger(__name__)


def _can_send_smtp() -> bool:
    """Check if valid non-placeholder SMTP credentials exist."""
    user = (settings.SMTP_USER or "").strip()
    pw = (settings.SMTP_PASSWORD or "").strip()
    if not user or not pw:
        return False
    if "your_email" in user or "your_gmail" in pw:
        return False
    return True


def _send_smtp_sync(to_email: str, subject: str, text_content: str, html_content: str) -> None:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    from_addr = settings.EMAIL_FROM or settings.SMTP_USER or "noreply@skillbridge.ai"
    message["From"] = f"SkillBridge AI <{from_addr}>"
    message["To"] = to_email

    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))

    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)


async def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send registration verification OTP.
    Tries real SMTP if configured; prints to console as fallback.
    Always returns True so registration is never blocked.
    """
    subject = "SkillBridge - Your Registration OTP Code"
    text_content = f"Welcome to SkillBridge!\n\nYour 6-digit verification OTP code is: {otp}\nThis code will expire in 10 minutes."
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0284c7; margin: 0; font-size: 26px;">SkillBridge AI</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Predictive Career & Resume Intelligence</p>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 12px;">Confirm Your Email Address</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Use the following 6-digit One-Time Password (OTP) to activate your SkillBridge account:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background: #f0f9ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #38bdf8; display: inline-block;">
              {otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            This OTP expires in 10 minutes. If you did not create this account, please ignore this email.
          </p>
        </div>
      </body>
    </html>
    """

    print(f"\n==========================================")
    print(f"[OTP DELIVERY] Verification OTP for {to_email}: {otp}")
    print(f"==========================================\n")

    if _can_send_smtp() and not settings.OTP_DEV_MODE:
        try:
            await run_in_threadpool(_send_smtp_sync, to_email, subject, text_content, html_content)
            logger.info(f"Verification OTP email delivered via SMTP to {to_email}")
            print(f"[EMAIL] Real email sent to {to_email} via SMTP.")
            return True
        except Exception as e:
            logger.warning(f"SMTP delivery failed ({e}). OTP printed to console.")
            print(f"[EMAIL WARNING] SMTP failed ({e}). Check Gmail App Password.")
            return True

    return True


async def send_registration_success_email(to_email: str, name: str) -> bool:
    """Send welcome email after account is activated."""
    subject = "Welcome to SkillBridge - Account Activated Successfully!"
    text_content = f"Hi {name},\n\nYour SkillBridge account has been verified successfully!\nYou can now upload your resume, analyze ATS compatibility, explore career roles, and follow personalized learning roadmaps."
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0284c7; margin-top: 0;">Welcome to SkillBridge, {name}! 🎉</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Your account has been verified and registered successfully.
          </p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a;">What you can do next:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
              <li>Upload your resume for real-time deep NLP parsing</li>
              <li>Evaluate your ATS compatibility score against any real Job Description</li>
              <li>Generate AI-driven 3-phase skill gap learning roadmaps</li>
            </ul>
          </div>
          <p style="font-size: 13px; color: #64748b;">Happy career building!<br>The SkillBridge Team</p>
        </div>
      </body>
    </html>
    """

    print(f"\n[EMAIL NOTIFICATION] Account verified for {name} ({to_email}).")

    if _can_send_smtp():
        try:
            await run_in_threadpool(_send_smtp_sync, to_email, subject, text_content, html_content)
            print(f"[EMAIL] Welcome email sent to {to_email}.")
            return True
        except Exception as e:
            print(f"[EMAIL WARNING] Could not send welcome email ({e}).")
    return True


async def send_ats_report_email(to_email: str, name: str, ats_result: Dict[str, Any], jd_title: Optional[str] = "Target Job") -> bool:
    """Send formatted ATS score evaluation report to candidate's email."""
    score = ats_result.get("overall_score", 0)
    skills_score = ats_result.get("skills_match", 0)
    exp_score = ats_result.get("experience_match", 0)
    edu_score = ats_result.get("education_match", 0)
    matched = ats_result.get("matched_keywords", [])
    missing = ats_result.get("missing_keywords", [])
    suggestions = ats_result.get("suggestions", [])

    matched_html = "".join(f"<li style='color: #16a34a;'>{s}</li>" for s in matched[:10]) or "<li>None identified</li>"
    missing_html = "".join(f"<li style='color: #dc2626;'>{s}</li>" for s in missing[:10]) or "<li>No critical gaps</li>"
    sugg_html = "".join(f"<li style='margin-bottom: 6px;'>{s}</li>" for s in suggestions[:4]) or "<li>Keep tailoring your resume to the specific job title.</li>"

    subject = f"SkillBridge ATS Report: {score}% Match for {jd_title}"
    text_content = f"SkillBridge ATS Match Report\nTarget: {jd_title}\nOverall Match: {score}%\nSkills Match: {skills_score}%\nExperience: {exp_score}%\nEducation: {edu_score}%\n"

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #0f172a; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #cbd5e1;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #0f172a; margin: 0;">ATS Compatibility Score Report</h2>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Evaluated for: <strong>{jd_title}</strong></p>
          </div>

          <div style="text-align: center; margin: 24px 0; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
            <div style="font-size: 42px; font-weight: bold; color: #15803d;">{score}%</div>
            <div style="font-size: 14px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Overall Match Score</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Skills Alignment:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0284c7;">{skills_score}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Experience Match:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0284c7;">{exp_score if exp_score is not None else 'N/A'}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Education Match:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0284c7;">{edu_score if edu_score is not None else 'N/A'}%</td>
            </tr>
          </table>

          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #166534;">✅ Matched Keywords ({len(matched)})</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.5;">{matched_html}</ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #991b1b;">⚠️ Missing Keywords ({len(missing)})</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.5;">{missing_html}</ul>
          </div>

          <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a;">💡 AI Improvement Advice</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">{sugg_html}</ul>
          </div>
        </div>
      </body>
    </html>
    """

    print(f"\n[EMAIL REPORT] Generated ATS Match Report ({score}%) for {to_email}.")

    if _can_send_smtp():
        try:
            await run_in_threadpool(_send_smtp_sync, to_email, subject, text_content, html_content)
            print(f"[EMAIL] ATS Report successfully sent to {to_email}.")
            return True
        except Exception as e:
            print(f"[EMAIL WARNING] Could not send ATS report email ({e}).")
    return True


async def send_course_enrollment_email(to_email: str, name: str, course_title: str, course_url: str, platform: Optional[str] = "Online Course") -> bool:
    """Send course enrollment / learning registration notification."""
    subject = f"SkillBridge: Learning Registered - {course_title}"
    text_content = f"Hi {name},\n\nYou have registered for the course: {course_title} ({platform}).\nAccess your course here: {course_url}\n\nKeep moving along your roadmap!"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0284c7; margin-top: 0;">Course Enrollment Confirmed 🚀</h2>
          <p style="font-size: 15px; color: #334155;">
            Hi {name}, you have selected the following course to bridge your skill gap:
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 18px;">{course_title}</h3>
            <span style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">
              Platform: {platform}
            </span>
            <div style="margin-top: 16px;">
              <a href="{course_url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 10px 20px; border-radius: 6px;">
                Start Learning Now &rarr;
              </a>
            </div>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            Direct link: <a href="{course_url}" style="color: #0284c7;">{course_url}</a>
          </p>
        </div>
      </body>
    </html>
    """

    print(f"\n[EMAIL NOTIFICATION] Course registration email for '{course_title}' to {to_email}.")

    if _can_send_smtp():
        try:
            await run_in_threadpool(_send_smtp_sync, to_email, subject, text_content, html_content)
            print(f"[EMAIL] Course registration sent to {to_email}.")
            return True
        except Exception as e:
            print(f"[EMAIL WARNING] Could not send course email ({e}).")
    return True
