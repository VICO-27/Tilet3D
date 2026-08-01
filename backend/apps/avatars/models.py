from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class AvatarProfile(models.Model):

    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
    )

    BODY_TYPE_CHOICES = (
        ('slim', 'Slim'),
        ('athletic', 'Athletic'),
        ('average', 'Average'),
        ('plus', 'Plus'),
        ('inverted_triangle', 'Inverted Triangle'),
        ('pear', 'Pear'),
        ('rectangle', 'Rectangle'),
    )

    SKIN_TONE_CHOICES = (
        ('ivory', 'Ivory'),
        ('fair', 'Fair'),
        ('light', 'Light'),
        ('honey', 'Honey'),
        ('medium', 'Medium'),
        ('caramel', 'Caramel'),
        ('tan', 'Tan'),
        ('chestnut', 'Chestnut'),
        ('rich', 'Rich'),
        ('espresso', 'Espresso'),
        ('deep', 'Deep'),
        ('ebony', 'Ebony'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avatar_profile',
    )

    nickname = models.CharField(
        max_length=50,
        blank=True,
        default='',
    )

    age = models.PositiveIntegerField(
        default=25,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(120),
        ],
    )

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        default='male',
    )

    body_type = models.CharField(
        max_length=20,
        choices=BODY_TYPE_CHOICES,
        default='average',
    )

    skin_tone = models.CharField(
        max_length=15,
        choices=SKIN_TONE_CHOICES,
        default='medium',
    )

    height = models.FloatField(
        help_text='Height in cm',
        default=170.0,
        validators=[
            MinValueValidator(50),
            MaxValueValidator(250),
        ],
    )

    weight = models.FloatField(
        help_text='Weight in kg',
        default=70.0,
        validators=[
            MinValueValidator(20),
            MaxValueValidator(300),
        ],
    )

    chest = models.FloatField(
        help_text='Chest circumference in cm',
        default=90.0,
    )

    waist = models.FloatField(
        help_text='Waist circumference in cm',
        default=80.0,
    )

    shoulder_width = models.FloatField(
        help_text='Shoulder-to-shoulder width in cm',
        default=45.0,
    )

    hips = models.FloatField(
        help_text='Hips circumference in cm',
        default=95.0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Avatar Profile'
        verbose_name_plural = 'Avatar Profiles'

    def __str__(self):
        label = (
            self.nickname
            or self.user.email
        )

        return (
            f"{label}'s Avatar "
            f"({self.gender})"
        )

    def as_measurement_snapshot(
        self,
    ) -> dict:
        """
        Returns a frozen plain-dict snapshot of
        the avatar measurements.

        Used by checkout so orders preserve
        the buyer's exact measurements at the
        time of purchase.
        """

        return {
            'nickname': self.nickname,
            'gender': self.gender,
            'body_type': self.body_type,
            'skin_tone': self.skin_tone,
            'height_cm': self.height,
            'weight_kg': self.weight,
            'chest_cm': self.chest,
            'waist_cm': self.waist,
            'shoulder_width_cm':
                self.shoulder_width,
            'hips_cm': self.hips,
        }