# backend/apps/avatars/api/views.py
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.avatars.models import AvatarProfile
from apps.avatars.api.serializers import AvatarProfileSerializer


class AvatarProfileDetailView(APIView):
    """
    GET    /api/avatars/me/  — fetch the current user's avatar profile (public —
                                guests get a 404 "no profile", not a permission error)
    POST   /api/avatars/me/  — upsert (create or fully replace) — auth required
    PATCH  /api/avatars/me/  — partial update (edit mode) — auth required
    DELETE /api/avatars/me/  — reset / delete the profile — auth required
    """

    def get_permissions(self):
        # FIX: was permission_classes = [IsAuthenticated] for ALL methods,
        # which 401'd guests on GET before the view ever ran — even though
        # the view's own logic (and the frontend's catch comment) assumed
        # a guest would just get a normal 404 "no profile" response.
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def _get_object(self, user):
        # Defensive: AnonymousUser has no real row to match, so treat it
        # explicitly as "no profile" rather than relying on the ORM's
        # AnonymousUser.pk == None coincidence.
        if not user or not user.is_authenticated:
            return None
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
        obj = self._get_object(request.user)
        if not obj:
            return Response(
                {'detail': 'No avatar profile found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)