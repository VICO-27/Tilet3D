from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.products.models import Category, Product, ProductVariant
from apps.products.api.serializers import ProductListSerializer

class ProductCreatedAtSerializerTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Kemis", slug="kemis")
        self.product = Product.objects.create(
            name="Test Traditional Kemis",
            slug="test-traditional-kemis",
            category=self.category,
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Standard",
            sku="TEST-KEMIS-001",
            price=Decimal("3500.00"),
            stock=10,
        )
        self.client = APIClient()

    def test_product_list_serializer_includes_created_at(self):
        serializer = ProductListSerializer(instance=self.product)
        data = serializer.data
        self.assertIn("created_at", data)
        self.assertIsNotNone(data["created_at"])

    def test_products_api_returns_created_at(self):
        response = self.client.get("/api/products/?page_size=5")
        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", [])
        self.assertTrue(len(results) > 0)
        self.assertIn("created_at", results[0])
