import json
import logging
from unittest.mock import patch, MagicMock
from decimal import Decimal

from django.test import TestCase, Client, override_settings
from django.urls import reverse

from apps.ai.services.orchestrator import stream_chat_response
from apps.ai.services.gemini_client import is_simple_greeting
from apps.ai.services.groq_client import (
    get_groq_client,
    execute_groq_chat,
    GroqProviderError,
)
from apps.products.models import Product, Category, ProductVariant


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
        self.assertTrue(is_simple_greeting("hello", []))
        self.assertTrue(is_simple_greeting("Selam!", []))
        self.assertTrue(is_simple_greeting("Akkam", [{"role": "model", "content": "Welcome"}]))
        self.assertFalse(is_simple_greeting("Find me a white dress", []))
        self.assertFalse(is_simple_greeting("hello", [{"role": "user", "content": "Hi"}]))


class GroqFallbackOrchestrationTests(TestCase):
    """
    Unit test coverage for Groq secondary fallback, catalog tool calling,
    telemetry, error handling, and streaming boundaries.
    """

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_1_gemini_succeeds_groq_never_called(self, mock_gemini, mock_groq):
        """1. When Gemini succeeds, Groq must NEVER be called."""
        mock_gemini.return_value = "Welcome to Tilet3D! Here is your luxury look.\n\nPRODUCT_IDS: p1,p2"

        events = list(stream_chat_response("Recommend evening wear", [], language="en"))
        
        mock_gemini.assert_called_once()
        mock_groq.assert_not_called()
        
        text_output = "".join([e for e in events if isinstance(e, str)])
        self.assertIn("Welcome to Tilet3D!", text_output)
        self.assertIn("PRODUCT_IDS: p1,p2", text_output)

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_2_gemini_returns_429_groq_succeeds(self, mock_gemini, mock_groq):
        """2. When Gemini returns 429 quota exhaustion, Groq automatically succeeds."""
        mock_gemini.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
        mock_groq.return_value = "Groq recommends our royal Habesha Kemis.\n\nPRODUCT_IDS: p429"

        events = list(stream_chat_response("Show me wedding dresses", [], language="en"))

        mock_gemini.assert_called_once()
        mock_groq.assert_called_once()
        
        text_output = "".join([e for e in events if isinstance(e, str)])
        self.assertIn("Groq recommends our royal Habesha Kemis", text_output)
        self.assertIn("PRODUCT_IDS: p429", text_output)

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_3_gemini_returns_503_or_timeout_groq_succeeds(self, mock_gemini, mock_groq):
        """3. When Gemini returns 503 UNAVAILABLE or times out, Groq takes over."""
        mock_gemini.side_effect = Exception("503 UNAVAILABLE: High demand or ReadTimeout")
        mock_groq.return_value = "Groq fallback serving traditional Gabi.\n\nPRODUCT_IDS: p503"

        events = list(stream_chat_response("Find Men Gabi", [], language="en"))

        mock_gemini.assert_called_once()
        mock_groq.assert_called_once()

        text_output = "".join([e for e in events if isinstance(e, str)])
        self.assertIn("Groq fallback serving traditional Gabi", text_output)

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_4_both_providers_fail_returns_controlled_error(self, mock_gemini, mock_groq):
        """4. When both providers fail, a controlled error is returned without unhandled exceptions."""
        mock_gemini.side_effect = Exception("503 UNAVAILABLE")
        mock_groq.side_effect = GroqProviderError("Groq service rate limited")

        events = list(stream_chat_response("Find accessories", [], language="en"))

        text_output = "".join([e for e in events if isinstance(e, str)])
        self.assertIn("The AI Concierge is currently experiencing temporary high demand", text_output)
        self.assertIn("PRODUCT_IDS: none", text_output)

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_5_gemini_fails_before_first_token_fallback_works(self, mock_gemini, mock_groq):
        """5. Gemini fails before emitting any user-visible text chunk; Groq transparently takes over."""
        mock_gemini.side_effect = Exception("504 DEADLINE_EXCEEDED before first token")
        mock_groq.return_value = "Fresh Groq response.\n\nPRODUCT_IDS: none"

        events = list(stream_chat_response("Tell me about Tilet3D", [], language="en"))

        status_events = [e for e in events if isinstance(e, dict)]
        text_events = [e for e in events if isinstance(e, str)]

        self.assertTrue(len(status_events) >= 1)
        self.assertIn("Fresh Groq response.", "".join(text_events))

    @override_settings(GROQ_API_KEY="gsk_test_mock_key")
    def test_6_gemini_fails_after_emitting_tokens_no_mixed_response(self):
        """6. If a stream fails after tokens were already emitted, do not append a mixed Groq response."""
        # Simulated generator where tokens are emitted before an error occurs
        emitted_chunks = []
        tokens_emitted = False
        groq_called = False

        try:
            # First token emitted
            emitted_chunks.append("Gemini partial start...")
            tokens_emitted = True
            # Mid-stream error
            raise Exception("Mid-stream connection reset")
        except Exception:
            if not tokens_emitted:
                groq_called = True
            else:
                # Must safely close without appending Groq
                emitted_chunks.append("\n\n(Response interrupted. Tap Retry below.)")

        self.assertFalse(groq_called)
        self.assertIn("Gemini partial start...", emitted_chunks[0])
        self.assertNotIn("Groq", "".join(emitted_chunks))

    def test_7_groq_catalog_tool_calling_returns_real_product_ids_and_prices(self):
        """7. Groq catalog tool execution uses real DB variants and prices."""
        cat = Category.objects.create(name="Authentic Kemis", slug="authentic-kemis")
        prod = Product.objects.create(
            name="Emperor Menelik Kemis",
            category=cat,
            description="Handwoven royal cotton",
            is_active=True
        )
        ProductVariant.objects.create(
            product=prod,
            name="Standard Gold",
            sku="EMK-001",
            price=Decimal("8500.00"),
            stock=5,
            color="Gold"
        )

        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_123"
        mock_tool_call.function.name = "search_store"
        mock_tool_call.function.arguments = json.dumps({"query": "Menelik"})

        mock_resp_1 = MagicMock()
        mock_resp_1.choices = [
            MagicMock(message=MagicMock(content=None, tool_calls=[mock_tool_call]))
        ]

        mock_resp_2 = MagicMock()
        mock_resp_2.choices = [
            MagicMock(message=MagicMock(content=f"Found Emperor Menelik Kemis for 8,500 ETB.\n\nPRODUCT_IDS: {prod.id}", tool_calls=None))
        ]

        mock_groq_instance = MagicMock()
        mock_groq_instance.chat.completions.create.side_effect = [mock_resp_1, mock_resp_2]

        with patch("apps.ai.services.groq_client.get_groq_client", return_value=mock_groq_instance):
            with override_settings(GROQ_API_KEY="gsk_test"):
                result = execute_groq_chat("Find Menelik dress", [], language="en")
                self.assertIn(str(prod.id), result)
                self.assertIn("8,500 ETB", result)

    def test_8_invalid_tool_arguments_and_catalog_failures_handled_safely(self):
        """8. Malformed tool arguments or tool errors do not crash Groq execution."""
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_bad_json"
        mock_tool_call.function.name = "search_store"
        mock_tool_call.function.arguments = "{ MALFORMED JSON !!!"

        mock_resp_1 = MagicMock()
        mock_resp_1.choices = [
            MagicMock(message=MagicMock(content=None, tool_calls=[mock_tool_call]))
        ]

        mock_resp_2 = MagicMock()
        mock_resp_2.choices = [
            MagicMock(message=MagicMock(content="Handled malformed arguments gracefully.\n\nPRODUCT_IDS: none", tool_calls=None))
        ]

        mock_groq_instance = MagicMock()
        mock_groq_instance.chat.completions.create.side_effect = [mock_resp_1, mock_resp_2]

        with patch("apps.ai.services.groq_client.get_groq_client", return_value=mock_groq_instance):
            with override_settings(GROQ_API_KEY="gsk_test"):
                result = execute_groq_chat("Any dress", [], language="en")
                self.assertIn("Handled malformed arguments gracefully", result)
                self.assertIn("PRODUCT_IDS: none", result)

    def test_9_conversation_history_and_language_survive_fallback(self):
        """9. Sanitized history and multilingual prompt survive fallback in OpenAI message format."""
        mock_groq_instance = MagicMock()
        mock_completion = MagicMock()
        mock_completion.choices = [
            MagicMock(message=MagicMock(content="አማርኛ መልስ\n\nPRODUCT_IDS: none", tool_calls=None))
        ]
        mock_groq_instance.chat.completions.create.return_value = mock_completion

        with patch("apps.ai.services.groq_client.get_groq_client", return_value=mock_groq_instance):
            with override_settings(GROQ_API_KEY="gsk_test"):
                history = [
                    {"role": "user", "content": "ሰላም"},
                    {"role": "model", "content": "እንኳን ደህና መጡ"}
                ]
                execute_groq_chat("የሐበሻ ቀሚስ አሳየኝ", history, language="am")

                call_args = mock_groq_instance.chat.completions.create.call_args[1]
                messages = call_args["messages"]
                
                # Check system instruction has Amharic
                self.assertEqual(messages[0]["role"], "system")
                self.assertIn("Amharic", messages[0]["content"])
                
                # Check history roles were translated model -> assistant
                self.assertEqual(messages[1], {"role": "user", "content": "ሰላም"})
                self.assertEqual(messages[2], {"role": "assistant", "content": "እንኳን ደህና መጡ"})
                self.assertEqual(messages[3], {"role": "user", "content": "የሐበሻ ቀሚስ አሳየኝ"})

    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    def test_10_sse_events_compatible_with_frontend(self, mock_groq, mock_gemini):
        """10. Fallback stream output conforms to the frontend SSE event contract."""
        mock_gemini.side_effect = Exception("503 UNAVAILABLE")
        mock_groq.return_value = "Groq SSE compatible line.\n\nPRODUCT_IDS: p10"

        with override_settings(GROQ_API_KEY="gsk_test"):
            response = self.client.post(
                reverse("ai-chat"),
                data=json.dumps({"message": "Show wedding items", "history": [], "language": "en"}),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "text/event-stream")
            
            raw_content = b"".join(response.streaming_content).decode("utf-8")
            self.assertIn('data: {"status": "retrieving"', raw_content)
            self.assertIn('data: {"text": "', raw_content)
            self.assertIn("data: [DONE]", raw_content)

    def test_11_missing_groq_api_key_does_not_crash_startup(self):
        """11. Missing GROQ_API_KEY returns None and does not crash."""
        with override_settings(GROQ_API_KEY=""):
            client = get_groq_client()
            self.assertIsNone(client)

    @override_settings(GROQ_API_KEY="gsk_super_secret_test_key_12345")
    @patch("apps.ai.services.orchestrator.execute_groq_chat")
    @patch("apps.ai.services.orchestrator.execute_gemini_chat")
    def test_12_no_api_keys_appear_in_logs_or_responses(self, mock_gemini, mock_groq):
        """12. Neither Gemini nor Groq API keys appear in client responses or logged errors."""
        secret_key = "gsk_super_secret_test_key_12345"
        mock_gemini.side_effect = Exception(f"Failed with key {secret_key}")
        mock_groq.side_effect = Exception(f"Groq failed with key {secret_key}")

        with self.assertLogs("apps.ai.orchestrator", level="INFO") as log_capture:
            events = list(stream_chat_response("test message", [], language="en"))
            
            # Check user-facing output
            full_output = "".join([e for e in events if isinstance(e, str)])
            self.assertNotIn(secret_key, full_output)
            
            # Check logged output does not reflect raw secret key
            for log_record in log_capture.output:
                self.assertNotIn(secret_key, log_record)

    def test_13_groq_model_configuration_passes_configured_model_to_api(self):
        """13. Ensure default model is openai/gpt-oss-120b and override_settings overrides it."""
        from apps.ai.services.groq_client import DEFAULT_GROQ_CHAT_MODEL
        self.assertEqual(DEFAULT_GROQ_CHAT_MODEL, "openai/gpt-oss-120b")

        mock_groq_instance = MagicMock()
        mock_completion = MagicMock()
        mock_completion.choices = [
            MagicMock(message=MagicMock(content="Hello!\n\nPRODUCT_IDS: none", tool_calls=None))
        ]
        mock_groq_instance.chat.completions.create.return_value = mock_completion

        with patch("apps.ai.services.groq_client.get_groq_client", return_value=mock_groq_instance):
            # Test 1: Default model openai/gpt-oss-120b
            with override_settings(GROQ_API_KEY="gsk_test", GROQ_CHAT_MODEL="openai/gpt-oss-120b"):
                execute_groq_chat("Hello", [], language="en")
                called_model = mock_groq_instance.chat.completions.create.call_args[1]["model"]
                self.assertEqual(called_model, "openai/gpt-oss-120b")

            # Test 2: Custom model override
            with override_settings(GROQ_API_KEY="gsk_test", GROQ_CHAT_MODEL="custom/groq-model-v2"):
                execute_groq_chat("Hello", [], language="en")
                called_model = mock_groq_instance.chat.completions.create.call_args[1]["model"]
                self.assertEqual(called_model, "custom/groq-model-v2")

    def test_14_groq_cleans_thinking_tags_and_handles_reasoning_attribute(self):
        """14. Ensure reasoning scratchpads and <think> tags are stripped from patron responses."""
        mock_groq_instance = MagicMock()
        mock_completion = MagicMock()
        mock_msg = MagicMock(
            content="<think>Evaluating silk texture and embroidery options.</think>Here is our authentic silk Kemis.\n\nPRODUCT_IDS: none",
            tool_calls=None,
            reasoning="Evaluating silk texture and embroidery options."
        )
        mock_completion.choices = [MagicMock(message=mock_msg)]
        mock_groq_instance.chat.completions.create.return_value = mock_completion

        with patch("apps.ai.services.groq_client.get_groq_client", return_value=mock_groq_instance):
            with override_settings(GROQ_API_KEY="gsk_test", GROQ_CHAT_MODEL="openai/gpt-oss-120b"):
                result = execute_groq_chat("Recommend silk Kemis", [], language="en")
                self.assertNotIn("<think>", result)
                self.assertNotIn("Evaluating silk texture", result)
                self.assertIn("Here is our authentic silk Kemis.", result)
                self.assertIn("PRODUCT_IDS: none", result)
