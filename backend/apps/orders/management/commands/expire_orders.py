# ==========================================================
# DJANGO MANAGEMENT COMMAND
# ==========================================================

from django.core.management.base import BaseCommand
from apps.orders.services.expiration import OrderExpirationService


class Command(BaseCommand):

    help = "Expire unpaid orders and release inventory"

    def handle(self, *args, **kwargs):
        OrderExpirationService.expire_orders()
        self.stdout.write(self.style.SUCCESS("Expired orders processed"))