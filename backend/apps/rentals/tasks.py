import logging
from celery import shared_task
from apps.rentals.services.booking import RentalBookingService

logger = logging.getLogger(__name__)


@shared_task(name="apps.rentals.tasks.task_expire_rental_holds")
def task_expire_rental_holds():
    """
    Periodic task to clean up unconfirmed rental reservations whose hold window has expired.
    Releases inventory back to rotation idempotently.
    """
    expired_count = RentalBookingService.expire_stale_holds()
    if expired_count:
        logger.info(f"Expired {expired_count} stale rental holds.")
    return f"Released {expired_count} expired rental holds."
