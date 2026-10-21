from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
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
def sample_category():
    return Category.objects.create(name="Festive Attire", slug="festive-attire")


@pytest.mark.django_db
def test_admin_products_unauthenticated_fails(api_client):
    """Unauthenticated access must receive 401 Unauthorized."""
    url = reverse("admin-product-list-create")
    response = api_client.get(url)
    assert response.status_code == 401

    response_post = api_client.post(url, {"name": "Test"})
    assert response_post.status_code == 401


@pytest.mark.django_db
def test_admin_products_non_staff_forbidden(api_client, create_user, sample_category):
    """Regular customers must be forbidden (403) from listing or creating products."""
    customer = create_user(email="buyer@tilet3d.com", password="Password123!", is_staff=False)
    api_client.force_authenticate(user=customer)

    url = reverse("admin-product-list-create")
    response = api_client.get(url)
    assert response.status_code == 403

    payload = {
        "name": "Unauthorized Kemis",
        "category_id": str(sample_category.id),
        "price": "1999.00",
        "stock": 5,
    }
    response_post = api_client.post(url, payload)
    assert response_post.status_code == 403


@pytest.mark.django_db
def test_admin_products_list_success(api_client, create_user, sample_category):
    """Staff can list both active and inactive products."""
    staff = create_user(email="staff@tilet3d.com", password="Password123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    p1 = Product.objects.create(name="Active Kemis", category=sample_category, is_active=True)
    ProductVariant.objects.create(product=p1, name="Standard", sku="SKU-ACT", price=Decimal("1500.00"), stock=10)

    p2 = Product.objects.create(name="Archived Netela", category=sample_category, is_active=False)
    ProductVariant.objects.create(product=p2, name="Standard", sku="SKU-ARC", price=Decimal("800.00"), stock=0)

    url = reverse("admin-product-list-create")
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.data["count"] >= 2
    names = [p["name"] for p in response.data["results"]]
    assert "Active Kemis" in names
    assert "Archived Netela" in names


@pytest.mark.django_db
def test_admin_product_creation_and_variant_generation(api_client, create_user, sample_category):
    """Staff can create a product with default variant and price."""
    staff = create_user(email="creator@tilet3d.com", password="Password123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    url = reverse("admin-product-list-create")
    payload = {
        "name": "Luxury Silk Kemis",
        "category_id": str(sample_category.id),
        "description": "Hand-spun Ethiopian cotton with gold silk thread embroidery.",
        "brand": "TILET3D",
        "price": "4500.00",
        "stock": 12,
        "sku": "KMS-LUX-01",
        "color": "Gold",
        "size": "M",
    }

    response = api_client.post(url, payload)
    assert response.status_code == 201
    data = response.data
    assert data["name"] == "Luxury Silk Kemis"
    assert data["category"]["name"] == "Festive Attire"
    assert len(data["variants"]) == 1
    assert data["variants"][0]["sku"] == "KMS-LUX-01"
    assert Decimal(str(data["variants"][0]["price"])) == Decimal("4500.00")
    assert data["variants"][0]["available_stock"] == 12

    # Verify DB presence
    product = Product.objects.get(name="Luxury Silk Kemis")
    assert product.variants.count() == 1
    assert product.is_active is True


@pytest.mark.django_db
def test_admin_product_creation_validation(api_client, create_user, sample_category):
    """Server-side validation rejects invalid prices, negative stock, and invalid categories."""
    staff = create_user(email="validator@tilet3d.com", password="Password123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    url = reverse("admin-product-list-create")

    # 1. Negative or zero price
    res_price = api_client.post(url, {
        "name": "Invalid Price Product",
        "category_id": str(sample_category.id),
        "price": "-50.00",
    })
    assert res_price.status_code == 400
    assert "price" in res_price.data

    # 2. Negative stock
    res_stock = api_client.post(url, {
        "name": "Negative Stock Product",
        "category_id": str(sample_category.id),
        "price": "100.00",
        "stock": -5,
    })
    assert res_stock.status_code == 400
    assert "stock" in res_stock.data

    # 3. Missing category
    res_cat = api_client.post(url, {
        "name": "No Category Product",
        "category_id": "00000000-0000-0000-0000-000000000000",
        "price": "100.00",
    })
    assert res_cat.status_code == 400
    assert "category_id" in res_cat.data


@pytest.mark.django_db
def test_admin_product_edit(api_client, create_user, sample_category):
    """Staff can edit an existing product and update variant price and stock."""
    staff = create_user(email="editor@tilet3d.com", password="Password123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    product = Product.objects.create(name="Initial Name", category=sample_category)
    variant = ProductVariant.objects.create(
        product=product,
        name="Default",
        sku="SKU-INIT",
        price=Decimal("1000.00"),
        stock=5,
    )

    url = reverse("admin-product-detail", kwargs={"id": product.id})
    payload = {
        "name": "Updated Name",
        "price": "1450.00",
        "stock": 20,
    }
    response = api_client.patch(url, payload)
    assert response.status_code == 200
    assert response.data["name"] == "Updated Name"

    variant.refresh_from_db()
    assert variant.price == Decimal("1450.00")
    assert variant.stock == 20


@pytest.mark.django_db
def test_admin_product_toggle_active_and_public_filtering(api_client, create_user, sample_category):
    """
    Staff can toggle product active status.
    When deactivated, product is hidden from public storefront (/api/products/).
    When reactivated, product is visible again.
    """
    staff = create_user(email="manager@tilet3d.com", password="Password123!", is_staff=True)
    api_client.force_authenticate(user=staff)

    product = Product.objects.create(name="Toggle Kemis", category=sample_category, is_active=True)
    ProductVariant.objects.create(
        product=product,
        name="Standard",
        sku="SKU-TOGGLE",
        price=Decimal("2500.00"),
        stock=10,
    )

    toggle_url = reverse("admin-product-toggle-active", kwargs={"id": product.id})

    # Deactivate
    res_deact = api_client.post(toggle_url)
    assert res_deact.status_code == 200
    assert res_deact.data["is_active"] is False
    product.refresh_from_db()
    assert product.is_active is False

    # Check public storefront: must NOT return the inactive product
    public_url = reverse("product-list")
    public_client = APIClient()  # unauthenticated storefront client
    res_public_1 = public_client.get(public_url)
    assert res_public_1.status_code == 200
    public_names_1 = [p["name"] for p in res_public_1.data.get("results", res_public_1.data)]
    assert "Toggle Kemis" not in public_names_1

    # Reactivate
    res_react = api_client.post(toggle_url)
    assert res_react.status_code == 200
    assert res_react.data["is_active"] is True
    product.refresh_from_db()
    assert product.is_active is True

    # Check public storefront: must now include the active product
    res_public_2 = public_client.get(public_url)
    assert res_public_2.status_code == 200
    public_names_2 = [p["name"] for p in res_public_2.data.get("results", res_public_2.data)]
    assert "Toggle Kemis" in public_names_2
