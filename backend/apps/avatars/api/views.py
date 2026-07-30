from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.avatars.models import AvatarProfile
from apps.avatars.api.serializers import AvatarProfileSerializer

class AvatarProfileDetailView(generics.GenericAPIView):
    serializer_class = AvatarProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return AvatarProfile.objects.get(user=self.request.user)
        except AvatarProfile.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj:
            return Response({"detail": "No avatar found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        # If exists, update. If not, create.
        obj = self.get_object()
        if obj:
            serializer = self.get_serializer(obj, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED if not obj else status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)