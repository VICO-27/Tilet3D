import logging
from celery import shared_task
from apps.orders.services.expiration import OrderExpirationService

logger = logging.getLogger(__name__)

@shared_task
def task_expire_orders():
    """
    Background task to release inventory for unpaid orders.
    Triggered periodically by Celery Beat.
    """
    logger.info("Starting periodic order expiration task...")
    
    try:
        OrderExpirationService.expire_orders()
        logger.info("Order expiration task completed successfully.")
    except Exception as e:
        logger.error(f"Error during order expiration task: {str(e)}")