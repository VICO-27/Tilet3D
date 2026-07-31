from rest_framework import serializers
from apps.avatars.models import AvatarProfile


class AvatarProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = AvatarProfile
        fields = [
            'id',
            'nickname',
            'age',
            'gender',
            'body_type',
            'skin_tone',
            'height',
            'weight',
            'chest',
            'waist',
            'shoulder_width',
            'hips',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']