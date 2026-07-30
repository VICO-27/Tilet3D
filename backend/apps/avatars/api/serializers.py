from rest_framework import serializers
from apps.avatars.models import AvatarProfile

class AvatarProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvatarProfile
        fields = [
            'id', 'nickname', 'age', 'gender', 'body_type', 
            'skin_tone', 'height', 'weight', 'chest', 
            'waist', 'shoulder_width', 'hips', 'updated_at'
        ]
        
    # The custom def create() method MUST be deleted. 
    # DRF will automatically handle the user assignment natively!