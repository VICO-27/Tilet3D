from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import generics, permissions
from apps.accounts.models import User
from .serializers import RegisterSerializer,  LoginSerializer
from rest_framework import generics, permissions  # <-- Add permissions here



# Create your views here.


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)