import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import OTPCode, OTPPurpose


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
        f"Your code is {otp.code}. "
        f"It expires in {settings.OTP_EXPIRY_MINUTES} minutes."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )