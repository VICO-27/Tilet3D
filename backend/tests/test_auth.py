import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user():
    def make_user(**kwargs):
        return User.objects.create_user(**kwargs)
    return make_user

@pytest.mark.django_db
def test_registration(api_client):
    url = reverse("register")
    response = api_client.post(url, {
        "email": "test@tilet3d.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "StrongPassword123!",
        "password2": "StrongPassword123!"
    })
    assert response.status_code == 201
    assert User.objects.filter(email="test@tilet3d.com").exists()

@pytest.mark.django_db
def test_login(api_client, create_user):
    user = create_user(email="test@tilet3d.com", password="StrongPassword123!")
    url = reverse("login")
    response = api_client.post(url, {
        "email": "test@tilet3d.com",
        "password": "StrongPassword123!"
    })
    assert response.status_code == 200

@pytest.mark.django_db
def test_invalid_login(api_client, create_user):
    user = create_user(email="test@tilet3d.com", password="StrongPassword123!")
    url = reverse("login")
    response = api_client.post(url, {
        "email": "test@tilet3d.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 400

@pytest.mark.django_db
def test_jwt_refresh(api_client, create_user):
    user = create_user(email="test@tilet3d.com", password="StrongPassword123!")
    refresh = RefreshToken.for_user(user)
    
    url = reverse("token_refresh")
    response = api_client.post(url, {
        "refresh": str(refresh)
    })
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_jwt_refresh_rotation_and_blacklist_reuse(api_client, create_user):
    user = create_user(email="test_rotation@tilet3d.com", password="StrongPassword123!")
    refresh_1 = RefreshToken.for_user(user)
    
    url = reverse("token_refresh")
    # First refresh: succeeds and returns new access and rotated refresh token
    response_1 = api_client.post(url, {"refresh": str(refresh_1)})
    assert response_1.status_code == 200
    assert "access" in response_1.data
    assert "refresh" in response_1.data
    refresh_2 = response_1.data["refresh"]
    assert refresh_2 != str(refresh_1)
    
    # Old token reuse: must be rejected with 401 because BLACKLIST_AFTER_ROTATION is enabled
    response_reuse = api_client.post(url, {"refresh": str(refresh_1)})
    assert response_reuse.status_code == 401
    
    # Rotated token use: succeeds and returns another new access and rotated refresh token
    response_2 = api_client.post(url, {"refresh": refresh_2})
    assert response_2.status_code == 200
    assert "access" in response_2.data
    assert "refresh" in response_2.data
    refresh_3 = response_2.data["refresh"]
    assert refresh_3 != refresh_2


@pytest.mark.django_db
def test_throttling_login(api_client, create_user):
    user = create_user(email="test@tilet3d.com", password="StrongPassword123!")
    url = reverse("login")
    
    for _ in range(10):
        api_client.post(url, {"email": "test@tilet3d.com", "password": "WrongPassword!"})
    
    response = api_client.post(url, {"email": "test@tilet3d.com", "password": "WrongPassword!"})
    assert response.status_code == 429

@pytest.mark.django_db
def test_unauthorized_request(api_client):
    url = reverse("profile")
    response = api_client.get(url)
    assert response.status_code == 401
