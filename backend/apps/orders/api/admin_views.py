from django.db import transaction
from django.db.models import Count, Q
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order, OrderStatus, PaymentStatus
from apps.orders.services.lifecycle import OrderLifecycle, OrderLifecycleError
from apps.products.services.inventory import InventoryService
from .admin_serializers import (
    AdminOrderListSerializer,
    AdminOrderDetailSerializer,
    AdminOrderTransitionSerializer,
)


class AdminOrderPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminOrderListAPIView(generics.ListAPIView):
    """
    Staff-only endpoint listing all store orders across all customers with filters and search.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminOrderListSerializer
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        queryset = (
            Order.objects.all()
            .select_related("user")
            .annotate(items_count=Count("items"))
            .order_by("-created_at")
        )

        # 1. Search filter (order number, customer name, phone, email)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search)
                | Q(full_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(user__email__icontains=search)
            )

        # 2. Fulfillment status filter
        status_param = self.request.query_params.get("status", "").strip().lower()
        if status_param and status_param != "all":
            queryset = queryset.filter(status=status_param)

        # 3. Payment status filter
        payment_status_param = self.request.query_params.get("payment_status", "").strip().lower()
        if payment_status_param and payment_status_param != "all":
            queryset = queryset.filter(payment_status=payment_status_param)

        return queryset


class AdminOrderDetailAPIView(generics.RetrieveAPIView):
    """
    Staff-only endpoint retrieving complete order details including delivery information,
    line items, avatar snapshots, and read-only payment summary.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminOrderDetailSerializer
    lookup_field = "id"
    queryset = (
        Order.objects.all()
        .select_related("user", "payment")
        .prefetch_related("items")
    )


class AdminOrderTransitionAPIView(APIView):
    """
    Staff-only endpoint for safely transitioning an order's fulfillment status.
    Enforces the OrderLifecycle state machine. Payment status cannot be altered here.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, id):
        try:
            order = (
                Order.objects
                .select_related("user", "payment")
                .prefetch_related("items__variant")
                .get(id=id)
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminOrderTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_status = serializer.validated_data["status"]
        reason = request.data.get("reason")

        try:
            with transaction.atomic():
                # Enforce state machine transition
                OrderLifecycle.transition(order, target_status, reason=reason)

                # If an unpaid pending order is cancelled, release reserved stock
                if target_status == OrderStatus.CANCELLED and order.payment_status == PaymentStatus.PENDING:
                    for item in order.items.all():
                        InventoryService.release(item.variant, item.quantity)

            response_serializer = AdminOrderDetailSerializer(order)
            return Response(
                {
                    "message": f"Order {order.order_number} status updated to '{target_status}'.",
                    "order": response_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except OrderLifecycleError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
