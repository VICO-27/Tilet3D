from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.orders.models import Order, OrderStatus, PaymentStatus
from apps.products.models import Category, Product, ProductVariant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def make_user(**kwargs):
        return User.objects.create_user(**kwargs)
    return make_user


@pytest.mark.django_db
def test_admin_overview_unauthenticated_fails(api_client):
    """Unauthenticated requests must be rejected with 401 Unauthorized."""
    url = reverse("admin-overview")
    response = api_client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_admin_overview_authenticated_non_staff_forbidden(api_client, create_user):
    """Authenticated non-staff users must receive 403 Forbidden."""
    user = create_user(email="regular@tilet3d.com", password="StrongPassword123!", is_staff=False)
    api_client.force_authenticate(user=user)

    url = reverse("admin-overview")
    response = api_client.get(url)
    assert response.status_code == 403
    assert response.data.get("detail") == "You do not have permission to perform this action."


@pytest.mark.django_db
def test_admin_overview_authenticated_staff_success(api_client, create_user):
    """Authenticated staff users must receive 200 OK with operational metrics."""
    staff = create_user(email="admin@tilet3d.com", password="StrongPassword123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    url = reverse("admin-overview")
    response = api_client.get(url)
    assert response.status_code == 200
    assert "metrics" in response.data
    assert "orders_by_status" in response.data


@pytest.mark.django_db
def test_admin_overview_metrics_accuracy_and_zero_pii(api_client, create_user):
    """
    Verifies that metrics match the test database exactly and
    zero customer personal information is leaked in dashboard statistics.
    """
    # 1. Staff user
    staff = create_user(email="manager@tilet3d.com", password="StrongPassword123!", is_staff=True)

    # 2. Regular customer users
    customer1 = create_user(email="cust1@tilet3d.com", password="StrongPassword123!", is_staff=False)
    customer2 = create_user(email="cust2@tilet3d.com", password="StrongPassword123!", is_staff=False)

    # 3. Catalog setup
    category = Category.objects.create(name="Festive Attire", slug="festive-attire")
    p1 = Product.objects.create(name="Habesha Kemis Gold", category=category, is_active=True)
    p2 = Product.objects.create(name="Vintage Netela", category=category, is_active=False)

    # Variants (one low stock, one healthy)
    ProductVariant.objects.create(product=p1, name="Standard M", sku="HK-GOLD-M", price=Decimal("3500.00"), stock=3, is_active=True)
    ProductVariant.objects.create(product=p1, name="Standard L", sku="HK-GOLD-L", price=Decimal("3500.00"), stock=15, is_active=True)

    # 4. Orders
    # Order 1: Paid & Confirmed (Revenue: 3500)
    Order.objects.create(
        user=customer1,
        order_number="ORD-TEST-001",
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        total=Decimal("3500.00"),
        full_name="Almaz Ayana",
        phone="+251911000001",
        region="Addis Ababa",
        city="Bole",
    )
    # Order 2: Pending payment (Revenue not included in paid revenue: 2000)
    Order.objects.create(
        user=customer2,
        order_number="ORD-TEST-002",
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        total=Decimal("2000.00"),
        full_name="Kenenisa Bekele",
        phone="+251911000002",
        region="Addis Ababa",
        city="Yeka",
    )
    # Order 3: Cancelled / Failed (Revenue not included)
    Order.objects.create(
        user=customer1,
        order_number="ORD-TEST-003",
        status=OrderStatus.CANCELLED,
        payment_status=PaymentStatus.FAILED,
        total=Decimal("1200.00"),
        full_name="Almaz Ayana",
        phone="+251911000001",
        region="Addis Ababa",
        city="Bole",
    )

    api_client.force_authenticate(user=staff)
    url = reverse("admin-overview")
    response = api_client.get(url)

    assert response.status_code == 200
    metrics = response.data["metrics"]
    orders_by_status = response.data["orders_by_status"]

    # Verify metrics
    assert metrics["total_products"] == 2
    assert metrics["active_products"] == 1
    assert metrics["total_orders"] == 3
    assert metrics["paid_orders"] == 1
    assert metrics["pending_orders"] == 1
    assert metrics["total_revenue"] == "3500.00"
    assert metrics["total_customers"] == 2  # customer1 & customer2 (excluding staff)
    assert metrics["low_stock_variants"] == 1  # stock=3 is <= 5

    # Verify order breakdown
    assert orders_by_status["confirmed"] == 1
    assert orders_by_status["pending"] == 1
    assert orders_by_status["cancelled"] == 1
    assert orders_by_status["processing"] == 0

    # Verify zero customer PII in response
    response_str = str(response.data)
    assert "cust1@tilet3d.com" not in response_str
    assert "cust2@tilet3d.com" not in response_str
    assert "Almaz" not in response_str
    assert "Kenenisa" not in response_str
    assert "+251911000001" not in response_str
    assert "+251911000002" not in response_str
