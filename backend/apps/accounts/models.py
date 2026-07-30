import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from common.models import BaseModel



from django.db import models
from django.conf import settings


class SecurityAuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="security_logs",
    )
    event = models.CharField(max_length=255)  # e.g. "Password Changed", "Successful Sign-in"
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.event} ({self.created_at})"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")

        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)

        # IMPORTANT: supports both email/password and Google login
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)




class Address(BaseModel):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    label = models.CharField(max_length=50, default="Home") # Home, Office, etc.
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=30)
    region = models.CharField(max_length=100, blank=True, default="Addis Ababa")
    city = models.CharField(max_length=100)
    sub_city = models.CharField(max_length=100, blank=True)
    woreda = models.CharField(max_length=100, blank=True)
    house_no = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        verbose_name_plural = "Addresses"

    def save(self, *args, **kwargs):
        # Ensure only one default address per user
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.label} ({self.city})"






class User(BaseModel, AbstractBaseUser, PermissionsMixin):
    """
    Core authentication identity model.
    DO NOT put business fields here (profile, avatar, address, etc).
    """

    #id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email


class Gender(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    OTHER = "other", "Other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"


class BodyType(models.TextChoices):
    SLIM = "slim", "Slim"
    ATHLETIC = "athletic", "Athletic"
    AVERAGE = "average", "Average"
    CURVY = "curvy", "Curvy"
    PLUS_SIZE = "plus_size", "Plus Size"


class SkinTone(models.TextChoices):
    FAIR = "fair", "Fair"
    LIGHT = "light", "Light"
    MEDIUM = "medium", "Medium"
    TAN = "tan", "Tan"
    DEEP = "deep", "Deep"


class Profile(BaseModel):
    """
    Stores user personal and avatar-related data.
    This is NOT authentication data.
    """

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="profile"
    )

    full_name = models.CharField(max_length=255, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    
    avatar_image = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
    )

    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        null=True,
    )

    body_type = models.CharField(
        max_length=20,
        choices=BodyType.choices,
        blank=True,
        null=True,
    )

    skin_tone = models.CharField(
        max_length=20,
        choices=SkinTone.choices,
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"

    def __str__(self):
        return f"{self.user.email} Profile"


class OTPPurpose(models.TextChoices):
    EMAIL_VERIFY = "email_verify", "Email Verification"
    PASSWORD_RESET = "password_reset", "Password Reset"


class OTPCode(BaseModel):
    """
    Short-lived one-time codes for email verification and password reset.
    """
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="otp_codes",
    )
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=OTPPurpose.choices)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "OTP Code"
        verbose_name_plural = "OTP Codes"

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.user.email} - {self.purpose} - {self.code}"