import time
from django.conf import settings
from django.core.management.base import BaseCommand
from apps.ai.services.groq_client import (
    get_groq_client,
    execute_groq_chat,
    DEFAULT_GROQ_CHAT_MODEL,
)


class Command(BaseCommand):
    help = "Live smoke test for Groq secondary fallback integration and tool calling."

    def add_arguments(self, parser):
        parser.add_argument(
            "--prompt",
            type=str,
            default="Find me a traditional Habesha Kemis under 10000 ETB",
            help="Prompt to test against Groq tool calling."
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== Tilet3D Groq Secondary Fallback Smoke Test ==="))

        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            self.stdout.write(self.style.ERROR("GROQ_API_KEY is not configured in settings/environment."))
            return

        masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
        model_name = getattr(settings, "GROQ_CHAT_MODEL", None) or DEFAULT_GROQ_CHAT_MODEL
        timeout = getattr(settings, "GROQ_TIMEOUT", 15)

        self.stdout.write(f"API Key: {masked_key}")
        self.stdout.write(f"Configured Model: {model_name}")
        self.stdout.write(f"Timeout: {timeout}s")

        client = get_groq_client()
        if not client:
            self.stdout.write(self.style.ERROR("Could not instantiate Groq client."))
            return

        # Phase 1: Simple greeting completion
        self.stdout.write("\n[1/2] Testing standard instruction-following...")
        t0 = time.time()
        try:
            res1 = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Say hello in 3 words"}]
            )
            content1 = (res1.choices[0].message.content or "").strip()
            dur1 = time.time() - t0
            self.stdout.write(self.style.SUCCESS(f"Standard completion OK in {dur1:.2f}s: {content1!r}"))
        except Exception as exc:
            dur1 = time.time() - t0
            self.stdout.write(self.style.ERROR(f"Standard completion failed in {dur1:.2f}s: {exc}"))
            return

        # Phase 2: Full execute_groq_chat with tool calling and catalog grounding
        test_prompt = options["prompt"]
        self.stdout.write(f"\n[2/2] Testing execute_groq_chat with prompt: {test_prompt!r}...")
        t1 = time.time()
        try:
            response_text = execute_groq_chat(
                message=test_prompt,
                history=[],
                language="en",
                request_id="smoke_test"
            )
            dur2 = time.time() - t1
            self.stdout.write(self.style.SUCCESS(f"execute_groq_chat OK in {dur2:.2f}s!"))
            self.stdout.write("\nPatron output:")
            self.stdout.write(response_text)
            self.stdout.write(self.style.SUCCESS("\n=== Groq Live Smoke Test PASSED ==="))
        except Exception as exc:
            dur2 = time.time() - t1
            self.stdout.write(self.style.ERROR(f"execute_groq_chat failed in {dur2:.2f}s: {exc}"))
