import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, Profile, SecurityAuditLog
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from apps.payments.models import Payment, PaymentProvider
from apps.products.models import Category, Product, ProductVariant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    user = User.objects.create_user(email="customer@example.com", password="password123")
    if hasattr(user, "profile"):
        user.profile.full_name = "Abebe Kebede"
        user.profile.save()
    return user


@pytest.fixture
def staff_user(db):
    user = User.objects.create_user(
        email="admin@tilet3d.com", password="staffpassword123", is_staff=True
    )
    if hasattr(user, "profile"):
        user.profile.full_name = "Admin Staff"
        user.profile.save()
    return user


@pytest.fixture
def sample_catalog(db):
    cat = Category.objects.create(name="Traditional Dresses", slug="traditional-dresses")
    prod = Product.objects.create(name="Habesha Kemis", slug="habesha-kemis", category=cat)
    var = ProductVariant.objects.create(
        product=prod,
        name="Gold Embroidery",
        sku="KEMIS-GOLD-M",
        color="Gold",
        size="M",
        price="4500.00",
        stock=10,
        reserved_stock=2,
        is_active=True,
    )
    return cat, prod, var


@pytest.mark.django_db
def test_unauthenticated_admin_endpoints_rejected(api_client):
    endpoints = [
        "admin-inventory-list",
        "admin-customer-list",
        "admin-payment-list",
        "admin-analytics",
        "admin-audit-logs",
        "admin-settings",
    ]
    for ep in endpoints:
        url = reverse(ep)
        res = api_client.get(url)
        assert res.status_code == 401, f"Endpoint {ep} must reject unauthenticated requests"


@pytest.mark.django_db
def test_non_staff_forbidden_from_admin_modules(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    endpoints = [
        "admin-inventory-list",
        "admin-customer-list",
        "admin-payment-list",
        "admin-analytics",
        "admin-audit-logs",
        "admin-settings",
    ]
    for ep in endpoints:
        url = reverse(ep)
        res = api_client.get(url)
        assert res.status_code == 403, f"Endpoint {ep} must forbid non-staff customers"


@pytest.mark.django_db
def test_staff_inventory_oversight_and_adjustment(api_client, staff_user, sample_catalog):
    cat, prod, var = sample_catalog
    api_client.force_authenticate(user=staff_user)

    # 1. List inventory
    res = api_client.get(reverse("admin-inventory-list"))
    assert res.status_code == 200
    assert res.data["count"] == 1
    item = res.data["results"][0]
    assert item["sku"] == "KEMIS-GOLD-M"
    assert item["stock"] == 10
    assert item["reserved_stock"] == 2
    assert item["available_stock"] == 8

    # 2. Reject adjustment below reserved stock
    adjust_url = reverse("admin-inventory-adjust", kwargs={"id": var.id})
    bad_res = api_client.post(adjust_url, {"stock": 1})
    assert bad_res.status_code == 400
    assert "reserved" in bad_res.data["detail"]

    # 3. Successful safe adjustment
    good_res = api_client.post(adjust_url, {"stock": 15})
    assert good_res.status_code == 200
    assert good_res.data["variant"]["stock"] == 15
    assert good_res.data["variant"]["available_stock"] == 13


@pytest.mark.django_db
def test_staff_customers_directory_and_privacy(api_client, staff_user, regular_user):
    api_client.force_authenticate(user=staff_user)

    res = api_client.get(reverse("admin-customer-list"))
    assert res.status_code == 200
    assert res.data["count"] == 1
    cust = res.data["results"][0]
    assert cust["email"] == regular_user.email
    assert cust["full_name"] == "Abebe Kebede"
    # Ensure no passwords or hashes leak
    assert "password" not in cust
    assert "token" not in cust


@pytest.mark.django_db
def test_staff_read_only_payments(api_client, staff_user, regular_user, sample_catalog):
    cat, prod, var = sample_catalog
    order = Order.objects.create(
        user=regular_user,
        order_number="TLT-20261021-0001",
        total="4500.00",
        full_name="Abebe Kebede",
        phone="+251911223344",
    )
    Payment.objects.create(
        user=regular_user,
        order=order,
        amount="4500.00",
        provider=PaymentProvider.CHAPA,
        status="success",
        transaction_id="CHAPA-TXN-123",
    )

    api_client.force_authenticate(user=staff_user)
    res = api_client.get(reverse("admin-payment-list"))
    assert res.status_code == 200
    assert res.data["count"] == 1
    p = res.data["results"][0]
    assert p["order_number"] == "TLT-20261021-0001"
    assert p["amount"] == "4500.00"
    assert p["transaction_id"] == "CHAPA-TXN-123"


@pytest.mark.django_db
def test_staff_analytics_and_settings_telemetry(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)

    # Analytics
    analytics_res = api_client.get(reverse("admin-analytics"))
    assert analytics_res.status_code == 200
    assert "financials" in analytics_res.data
    assert "orders_by_status" in analytics_res.data
    assert "top_products" in analytics_res.data
    assert "inventory_health" in analytics_res.data

    # Settings telemetry (no credentials exposed)
    settings_res = api_client.get(reverse("admin-settings"))
    assert settings_res.status_code == 200
    assert "platform" in settings_res.data
    assert "integrations" in settings_res.data
    content_str = str(settings_res.data).lower()
    assert "secret" not in content_str
    assert "password" not in content_str
