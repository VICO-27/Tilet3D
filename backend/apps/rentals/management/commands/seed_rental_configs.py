from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.products.models import Product
from apps.rentals.models import RentalProductConfig, RentalPackage


class Command(BaseCommand):
    help = "Initializes default rental configurations for catalog products."

    def handle(self, *args, **options):
        count = 0
        products = Product.objects.all()
        for p in products:
            cfg, _ = RentalProductConfig.objects.get_or_create(
                product=p,
                defaults={
                    'is_rental_enabled': True,
                    'rental_inventory_count': 3,
                    'daily_rate': Decimal('850.00'),
                    'security_deposit': Decimal('1500.00'),
                    'delivery_fee': Decimal('150.00'),
                    'min_rental_days': 1,
                    'max_rental_days': 30,
                    'cleaning_buffer_days': 1,
                }
            )
            if not cfg.is_rental_enabled:
                cfg.is_rental_enabled = True
                cfg.save()

            if not cfg.packages.exists():
                RentalPackage.objects.create(
                    config=cfg,
                    name='3-Day Weekend Special',
                    duration_days=3,
                    price=Decimal('2200.00'),
                    display_order=1,
                    is_active=True,
                )
                RentalPackage.objects.create(
                    config=cfg,
                    name='7-Day Celebration Package',
                    duration_days=7,
                    price=Decimal('4800.00'),
                    display_order=2,
                    is_active=True,
                )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully configured rental for {count} products."))
