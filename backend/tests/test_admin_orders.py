from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from apps.payments.models import Payment, PaymentProvider, PaymentStatus as GatewayPaymentStatus
from apps.products.models import Category, Product, ProductVariant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def make_user(**kwargs):
        return User.objects.create_user(**kwargs)
    return make_user


@pytest.fixture
def setup_order_data(create_user):
    staff = create_user(email="staff_orders@tilet3d.com", password="Password123!", is_staff=True)
    customer = create_user(email="client@tilet3d.com", password="Password123!", is_staff=False)

    category = Category.objects.create(name="Festive Attire", slug="festive-attire")
    product = Product.objects.create(name="Royal Habesha Kemis", category=category)
    variant = ProductVariant.objects.create(
        product=product,
        name="Gold Edition",
        sku="KMS-GOLD-01",
        price=Decimal("4500.00"),
        stock=10,
        reserved_stock=1,
    )

    order = Order.objects.create(
        user=customer,
        order_number="ORD-TEST-1001",
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        subtotal=Decimal("4500.00"),
        shipping_fee=Decimal("150.00"),
        total=Decimal("4650.00"),
        full_name="Tigist Assefa",
        phone="+251911223344",
        region="Addis Ababa",
        city="Bole",
        sub_city="Bole Sub-City",
        woreda="Woreda 03",
        house_no="B-41",
        note="Please handle with care.",
    )

    OrderItem.objects.create(
        order=order,
        product=product,
        variant=variant,
        product_name=product.name,
        variant_name=variant.name,
        sku=variant.sku,
        color="Gold",
        size="M",
        price=Decimal("4500.00"),
        quantity=1,
        subtotal=Decimal("4500.00"),
    )

    payment = Payment.objects.create(
        user=customer,
        order=order,
        amount=order.total,
        currency="ETB",
        status=GatewayPaymentStatus.SUCCESS,
        provider=PaymentProvider.CHAPA,
        transaction_id="chapa-tx-12345",
    )

    return {
        "staff": staff,
        "customer": customer,
        "order": order,
        "variant": variant,
        "payment": payment,
    }


@pytest.mark.django_db
def test_admin_orders_unauthenticated_fails(api_client, setup_order_data):
    """Unauthenticated requests must be rejected with 401 Unauthorized."""
    order = setup_order_data["order"]
    url_list = reverse("admin-order-list")
    assert api_client.get(url_list).status_code == 401

    url_detail = reverse("admin-order-detail", kwargs={"id": order.id})
    assert api_client.get(url_detail).status_code == 401

    url_transition = reverse("admin-order-transition", kwargs={"id": order.id})
    assert api_client.post(url_transition, {"status": OrderStatus.PROCESSING}).status_code == 401


@pytest.mark.django_db
def test_admin_orders_non_staff_forbidden(api_client, setup_order_data):
    """Authenticated non-staff customers must receive 403 Forbidden."""
    customer = setup_order_data["customer"]
    order = setup_order_data["order"]
    api_client.force_authenticate(user=customer)

    url_list = reverse("admin-order-list")
    assert api_client.get(url_list).status_code == 403

    url_detail = reverse("admin-order-detail", kwargs={"id": order.id})
    assert api_client.get(url_detail).status_code == 403

    url_transition = reverse("admin-order-transition", kwargs={"id": order.id})
    assert api_client.post(url_transition, {"status": OrderStatus.PROCESSING}).status_code == 403


@pytest.mark.django_db
def test_admin_orders_list_and_search(api_client, setup_order_data):
    """Staff can list all orders and search by customer name, order number, and phone."""
    staff = setup_order_data["staff"]
    order = setup_order_data["order"]
    api_client.force_authenticate(user=staff)

    url = reverse("admin-order-list")
    res = api_client.get(url)
    assert res.status_code == 200
    assert res.data["count"] >= 1
    assert res.data["results"][0]["order_number"] == order.order_number
    assert res.data["results"][0]["full_name"] == "Tigist Assefa"
    assert res.data["results"][0]["payment_status"] == PaymentStatus.PAID
    assert "processing" in res.data["results"][0]["allowed_transitions"]

    # Search by order number
    res_search_num = api_client.get(f"{url}?search=ORD-TEST-1001")
    assert res_search_num.status_code == 200
    assert res_search_num.data["count"] == 1

    # Search by phone
    res_search_phone = api_client.get(f"{url}?search=223344")
    assert res_search_phone.status_code == 200
    assert res_search_phone.data["count"] == 1

    # Filter by status
    res_filter = api_client.get(f"{url}?status=confirmed")
    assert res_filter.status_code == 200
    assert res_filter.data["count"] == 1


@pytest.mark.django_db
def test_admin_order_detail_view(api_client, setup_order_data):
    """Staff can retrieve detailed order information with line items and payment summary."""
    staff = setup_order_data["staff"]
    order = setup_order_data["order"]
    api_client.force_authenticate(user=staff)

    url = reverse("admin-order-detail", kwargs={"id": order.id})
    res = api_client.get(url)
    assert res.status_code == 200
    data = res.data
    assert data["order_number"] == "ORD-TEST-1001"
    assert data["customer_email"] == "client@tilet3d.com"
    assert data["phone"] == "+251911223344"
    assert len(data["items"]) == 1
    assert data["items"][0]["product_name"] == "Royal Habesha Kemis"
    assert data["items"][0]["sku"] == "KMS-GOLD-01"
    assert data["payment"]["status"] == GatewayPaymentStatus.SUCCESS
    assert data["payment"]["provider"] == PaymentProvider.CHAPA


@pytest.mark.django_db
def test_admin_order_transition_valid_lifecycle(api_client, setup_order_data):
    """Staff can transition order status safely along allowed lifecycle states."""
    staff = setup_order_data["staff"]
    order = setup_order_data["order"]
    api_client.force_authenticate(user=staff)

    transition_url = reverse("admin-order-transition", kwargs={"id": order.id})

    # Step 1: Confirmed -> Processing
    res1 = api_client.post(transition_url, {"status": OrderStatus.PROCESSING})
    assert res1.status_code == 200
    order.refresh_from_db()
    assert order.status == OrderStatus.PROCESSING
    assert "shipped" in res1.data["order"]["allowed_transitions"]

    # Step 2: Processing -> Shipped
    res2 = api_client.post(transition_url, {"status": OrderStatus.SHIPPED})
    assert res2.status_code == 200
    order.refresh_from_db()
    assert order.status == OrderStatus.SHIPPED
    assert "delivered" in res2.data["order"]["allowed_transitions"]

    # Step 3: Shipped -> Delivered
    res3 = api_client.post(transition_url, {"status": OrderStatus.DELIVERED})
    assert res3.status_code == 200
    order.refresh_from_db()
    assert order.status == OrderStatus.DELIVERED
    assert res3.data["order"]["allowed_transitions"] == []


@pytest.mark.django_db
def test_admin_order_transition_invalid_rejected(api_client, setup_order_data):
    """Invalid transitions are strictly rejected by the OrderLifecycle engine with 400 Bad Request."""
    staff = setup_order_data["staff"]
    order = setup_order_data["order"]
    api_client.force_authenticate(user=staff)

    transition_url = reverse("admin-order-transition", kwargs={"id": order.id})

    # Attempt illegal transition: Confirmed -> Delivered directly
    res = api_client.post(transition_url, {"status": OrderStatus.DELIVERED})
    assert res.status_code == 400
    assert "Invalid transition" in res.data["detail"]

    order.refresh_from_db()
    assert order.status == OrderStatus.CONFIRMED


@pytest.mark.django_db
def test_admin_order_cancellation_releases_pending_inventory(api_client, create_user):
    """Cancelling an unpaid pending order releases reserved stock back to available pool."""
    staff = create_user(email="staff_cancel@tilet3d.com", password="Password123!", is_staff=True)
    customer = create_user(email="buyer_cancel@tilet3d.com", password="Password123!", is_staff=False)

    category = Category.objects.create(name="Kemis", slug="kemis-cancel")
    product = Product.objects.create(name="Silk Kemis", category=category)
    variant = ProductVariant.objects.create(
        product=product,
        name="Standard",
        sku="SKU-CANCEL",
        price=Decimal("2000.00"),
        stock=10,
        reserved_stock=2,
    )

    pending_order = Order.objects.create(
        user=customer,
        order_number="ORD-PEND-001",
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        total=Decimal("4000.00"),
        full_name="Abebe Bikila",
        phone="+251911999999",
        region="Addis Ababa",
        city="Yeka",
    )

    OrderItem.objects.create(
        order=pending_order,
        product=product,
        variant=variant,
        product_name=product.name,
        variant_name=variant.name,
        sku=variant.sku,
        price=Decimal("2000.00"),
        quantity=2,
        subtotal=Decimal("4000.00"),
    )

    api_client.force_authenticate(user=staff)
    transition_url = reverse("admin-order-transition", kwargs={"id": pending_order.id})

    res = api_client.post(transition_url, {"status": OrderStatus.CANCELLED})
    assert res.status_code == 200
    pending_order.refresh_from_db()
    assert pending_order.status == OrderStatus.CANCELLED

    # Check that reserved_stock was released back
    variant.refresh_from_db()
    assert variant.reserved_stock == 0
