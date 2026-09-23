from rest_framework import serializers

class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    history = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        required=False,
        default=list
    )