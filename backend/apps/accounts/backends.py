from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend:
    """
    Custom authentication backend using email instead of username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Django passes 'username' even if we use email login.
        """

        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            return None

        if user.check_password(password):
            return user

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None