import logging
import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import OTPCode, OTPPurpose, SecurityAuditLog

logger = logging.getLogger(__name__)


def log_security_event(request, user, event_description):
    ip = "127.0.0.1"
    user_agent = ""

    if request is not None:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")
        user_agent = request.META.get("HTTP_USER_AGENT", "")

    try:
        SecurityAuditLog.objects.create(
            user=user,
            event=event_description,
            ip_address=ip,
            user_agent=user_agent,
        )
    except Exception as e:
        logger.warning(f"Could not create security audit log: {e}")


def generate_otp(user, purpose):
    # Invalidate any previous unused OTPs of the same purpose
    OTPCode.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)

    code = f"{random.randint(0, 999999):06d}"
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    return OTPCode.objects.create(
        user=user,
        code=code,
        purpose=purpose,
        expires_at=expires_at,
    )


def send_otp_email(user, otp):
    if otp.purpose == OTPPurpose.EMAIL_VERIFY:
        subject = "Verify your Tilet3D account"
    else:
        subject = "Reset your Tilet3D password"

    message = (
        f"Your verification code is {otp.code}.\n\n"
        f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
        "If you did not request this code, please ignore this email."
    )

    # When SMTP is not configured or in console mode, print directly to logs so registration never stalls
    is_console = getattr(settings, "EMAIL_BACKEND", "").endswith("console.EmailBackend")
    has_credentials = bool(getattr(settings, "EMAIL_HOST_USER", ""))
    if is_console or not has_credentials:
        logger.info(f"[OTP LOG] Purpose: {otp.purpose} | User: {user.email} | Code: {otp.code}")
        print(f"\n==========================================")
        print(f"[OTP LOG] Purpose: {otp.purpose}")
        print(f"[OTP LOG] To: {user.email}")
        print(f"[OTP LOG] OTP Code: {otp.code}")
        print(f"==========================================\n")
        return True

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {user.email}: {e}")
        # Always output code to server logs as fallback so user can be verified via logs
        print(f"\n==========================================")
        print(f"[OTP FALLBACK] Purpose: {otp.purpose}")
        print(f"[OTP FALLBACK] To: {user.email}")
        print(f"[OTP FALLBACK] OTP Code: {otp.code}")
        print(f"==========================================\n")
        return False