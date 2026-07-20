from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, Profile, OTPCode, OTPPurpose


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ["email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            "user": {
                "id": str(instance.id),
                "email": instance.email,
                "is_verified": instance.is_verified,
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        }


class LoginSerializer(serializers.Serializer):
    """
    Authenticate a user using email and password
    and return JWT tokens.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        # Authenticate using our custom EmailBackend
        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid email or password."]}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": ["This account is inactive."]}
            )

        refresh = RefreshToken.for_user(user)

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        }


class ProfileSerializer(serializers.ModelSerializer):
    # Human-readable labels for the frontend UI dropdowns/displays
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)
    body_type_display = serializers.CharField(source="get_body_type_display", read_only=True)
    skin_tone_display = serializers.CharField(source="get_skin_tone_display", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "full_name",
            "nickname",
            "avatar_image",
            "gender",
            "gender_display",
            "body_type",
            "body_type_display",
            "skin_tone",
            "skin_tone_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        # extra safety layer (prevents accidental overwrite bugs)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTPPurpose.choices)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account with this email.")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=OTPPurpose.choices)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "No account with this email."})

        otp = (
            OTPCode.objects.filter(user=user, purpose=attrs["purpose"], is_used=False)
            .order_by("-created_at")
            .first()
        )

        if otp is None or not otp.is_valid():
            raise serializers.ValidationError({"code": "OTP is invalid or expired."})

        if otp.code != attrs["code"]:
            raise serializers.ValidationError({"code": "Incorrect code."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "No account with this email."})

        otp = (
            OTPCode.objects.filter(user=user, purpose=OTPPurpose.PASSWORD_RESET, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if otp is None or not otp.is_valid():
            raise serializers.ValidationError({"code": "OTP is invalid or expired."})

        if otp.code != attrs["code"]:
            raise serializers.ValidationError({"code": "Incorrect code."})

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self):
        user = self.validated_data["user"]
        otp = self.validated_data["otp"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        
        otp.is_used = True
        otp.save()
        return user