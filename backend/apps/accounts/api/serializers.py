from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, Profile



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user
    

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
    class Meta:
        model = Profile
        fields = [
            "id",
            "full_name",
            "nickname",
            "gender",
            "body_type",
            "skin_tone",
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