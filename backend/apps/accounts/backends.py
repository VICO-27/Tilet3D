from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend:

    def authenticate(
        self,
        request,
        username=None,
        email=None,
        password=None,
        **kwargs,
    ):
        # Accept either "username" or "email"
        email = email or username

        if email is None or password is None:
            return None

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        if user.check_password(password) and user.is_active:
            return user

        return None

    def get_user(self, user_id):
        """
        Return the user object from the database.
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None