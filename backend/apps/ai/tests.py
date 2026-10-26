import json
from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch


class AIChatEndpointTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.chat_url = reverse("ai-chat")

    def test_cors_preflight_allows_accept_language(self):
        """Preflight OPTIONS request with accept-language must be allowed."""
        response = self.client.options(
            self.chat_url,
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,accept-language",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Access-Control-Allow-Origin"), "http://localhost:5173")
        allow_headers = response.get("Access-Control-Allow-Headers", "").lower()
        self.assertIn("accept-language", allow_headers)

    def test_chat_requires_message(self):
        """POST /api/ai/chat/ without message returns 400 Bad Request."""
        response = self.client.post(
            self.chat_url,
            data=json.dumps({"message": "   "}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    @patch("apps.ai.api.views.stream_chat_response")
    def test_chat_streams_sse_format(self, mock_stream):
        """POST /api/ai/chat/ returns text/event-stream with data: chunks and [DONE]."""
        mock_stream.return_value = ["Hello", " customer!"]

        response = self.client.post(
            self.chat_url,
            data=json.dumps({"message": "Hello", "history": [], "language": "en"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/event-stream")

        content = b"".join(response.streaming_content).decode("utf-8")
        self.assertIn('data: {"text": "Hello"}', content)
        self.assertIn('data: {"text": " customer!"}', content)
        self.assertIn("data: [DONE]", content)

    @patch("apps.ai.api.views.stream_chat_response")
    def test_chat_streams_status_events_and_text(self, mock_stream):
        """POST /api/ai/chat/ handles dictionary status events and text chunks."""
        mock_stream.return_value = [
            {"status": "retrieving", "detail": "Finding the right pieces..."},
            "Here are ",
            "our Kemis pieces.",
        ]

        response = self.client.post(
            self.chat_url,
            data=json.dumps({"message": "Find Kemis", "history": [], "language": "en"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        content = b"".join(response.streaming_content).decode("utf-8")
        self.assertIn('data: {"status": "retrieving", "detail": "Finding the right pieces..."}', content)
        self.assertIn('data: {"text": "Here are "}', content)
        self.assertIn('data: {"text": "our Kemis pieces."}', content)
        self.assertIn("data: [DONE]", content)

    def test_is_simple_greeting(self):
        """Verify fast-path greeting triggers only for initial greetings without prior user turns."""
        from apps.ai.services.gemini_client import is_simple_greeting
        self.assertTrue(is_simple_greeting("hello", []))
        self.assertTrue(is_simple_greeting("Selam!", []))
        self.assertTrue(is_simple_greeting("Akkam", [{"role": "model", "content": "Welcome"}]))
        self.assertFalse(is_simple_greeting("Find me a white dress", []))
        self.assertFalse(is_simple_greeting("hello", [{"role": "user", "content": "Hi"}]))

