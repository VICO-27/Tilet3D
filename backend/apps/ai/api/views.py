import json

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from apps.ai.services.gemini_client import stream_chat_response
from apps.ai.services.recommend import get_similar_products
from apps.ai.api.serializers import ChatMessageSerializer
from apps.products.api.serializers import ProductSerializer
from apps.products.models import Product


class ChatView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_chat'

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data["message"].strip()
        history = serializer.validated_data.get("history", [])

        if not message:
            return Response(
                {"detail": "message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def event_stream():
            try:
                for chunk in stream_chat_response(message, history):
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
            except Exception as exc:
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(
            event_stream(), content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class RecommendView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        similar = get_similar_products(product, limit=6)
        serializer = ProductSerializer(
            similar, many=True, context={"request": request}
        )
        return Response(serializer.data)



class ProductsByIdsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list):
            return Response(
                {"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST
            )
        products = Product.objects.filter(id__in=ids, is_active=True)
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)


class SearchView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_search'

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        if not query:
            return Response(
                {"detail": "q parameter is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        from apps.ai.services.recommend import semantic_search_products
        from apps.ai.services.gemini_client import AIOfflineError

        try:
            results = semantic_search_products(query, limit=12)
        except AIOfflineError:
            return Response(
                {"detail": "Semantic search is currently unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        serializer = ProductSerializer(results, many=True, context={"request": request})
        return Response({"query": query, "results": serializer.data})