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
        ('fair', 'Fair'),
        ('light', 'Light'),
        ('medium', 'Medium'),
        ('tan', 'Tan'),
        ('rich', 'Rich'),
        ('deep', 'Deep'),
    )

    # Link to the main auth user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='avatar_profile'
    )
    
    # Basic Info
    nickname = models.CharField(max_length=50, blank=True)
    age = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(120)], default=25)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    
    # Visuals
    body_type = models.CharField(max_length=20, choices=BODY_TYPE_CHOICES, default='average')
    skin_tone = models.CharField(max_length=15, choices=SKIN_TONE_CHOICES, default='medium')
    
    # Biometrics (Units in CM and KG)
    height = models.FloatField(
        help_text="Height in cm", 
        validators=[MinValueValidator(50), MaxValueValidator(250)], 
        default=170.0
    )
    weight = models.FloatField(
        help_text="Weight in kg", 
        validators=[MinValueValidator(20), MaxValueValidator(300)], 
        default=70.0
    )

    # Detailed Measurements for Perfect Fit
    chest = models.FloatField(help_text="Chest circumference in cm", default=90.0)
    waist = models.FloatField(help_text="Waist circumference in cm", default=80.0)
    shoulder_width = models.FloatField(help_text="Shoulder to shoulder width in cm", default=45.0)
    hips = models.FloatField(help_text="Hips circumference in cm", default=95.0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nickname or self.user.username}'s Avatar ({self.gender})"