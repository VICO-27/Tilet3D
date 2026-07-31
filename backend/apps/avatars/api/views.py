from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.avatars.models import AvatarProfile
from apps.avatars.api.serializers import AvatarProfileSerializer


class AvatarProfileDetailView(APIView):
    """
    GET    /api/avatars/me/  — fetch the current user's avatar profile
    POST   /api/avatars/me/  — upsert (create or fully replace)
    PATCH  /api/avatars/me/  — partial update (edit mode)
    DELETE /api/avatars/me/  — reset / delete the profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_object(self, user):
        try:
            return AvatarProfile.objects.get(user=user)
        except AvatarProfile.DoesNotExist:
            return None

    def get(self, request):
        obj = self._get_object(request.user)
        if not obj:
            return Response(
                {'detail': 'No avatar profile found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(AvatarProfileSerializer(obj).data)

    def post(self, request):
        """Upsert — frontend always calls POST on confirm."""
        obj = self._get_object(request.user)
        if obj:
            serializer = AvatarProfileSerializer(obj, data=request.data, partial=False)
        else:
            serializer = AvatarProfileSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        http_status = status.HTTP_200_OK if obj else status.HTTP_201_CREATED
        return Response(serializer.data, status=http_status)

    def patch(self, request):
        """Partial update — called by frontend edit form."""
        obj = self._get_object(request.user)
        if not obj:
            return Response(
                {'detail': 'No avatar profile found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = AvatarProfileSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        """Reset — removes the avatar profile entirely."""
        obj = self._get_object(request.user)
        if not obj:
            return Response(
                {'detail': 'No avatar profile found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)