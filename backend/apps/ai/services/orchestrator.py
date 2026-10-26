import json
import logging
import time
import uuid
from typing import Generator, Union
from django.conf import settings

from apps.ai.services.gemini_client import (
    is_simple_greeting,
    GREETINGS_BY_LANG,
    execute_gemini_chat,
)
from apps.ai.services.groq_client import (
    get_groq_client,
    execute_groq_chat,
    GroqConfigurationError,
    GroqProviderError,
)

import re

logger = logging.getLogger("apps.ai.orchestrator")


def sanitize_log_message(msg: str) -> str:
    """Sanitize error messages to ensure API keys and secrets are never logged."""
    if not msg:
        return ""
    text = str(msg)
    # Redact configured secrets
    for key_name in ("GEMINI_API_KEY", "GROQ_API_KEY", "SECRET_KEY"):
        val = getattr(settings, key_name, "")
        if val and len(val) > 4:
            text = text.replace(val, f"[REDACTED_{key_name}]")
    # Redact common key patterns (e.g., gsk_..., AIza...)
    text = re.sub(r'gsk_[A-Za-z0-9_]{10,}', '[REDACTED_GROQ_KEY]', text)
    text = re.sub(r'AIza[A-Za-z0-9_\-]{10,}', '[REDACTED_GEMINI_KEY]', text)
    return text


def is_recoverable_gemini_error(exc: Exception) -> bool:
    """Determine whether a Gemini exception is recoverable via secondary provider fallback."""
    err_str = str(exc).upper()
    recoverable_signatures = (
        "RESOURCE_EXHAUSTED",
        "429",
        "500",
        "502",
        "503",
        "UNAVAILABLE",
        "504",
        "DEADLINE",
        "TIMEOUT",
        "READTIMEOUT",
        "REMOTEPROTO",
        "CONNECTION",
        "OFFLINE",
        "DISCONNECTED",
        "NOT_FOUND",
        "404",
    )
    return any(sig in err_str for sig in recoverable_signatures)


def categorize_error(exc: Exception) -> str:
    """Return a sanitized category label for provider errors (no customer PII or credentials)."""
    err_str = str(exc).upper()
    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
        return "rate_limited_429"
    if "503" in err_str or "UNAVAILABLE" in err_str:
        return "service_unavailable_503"
    if "504" in err_str or "DEADLINE" in err_str:
        return "deadline_exceeded_504"
    if "TIMEOUT" in err_str or "READTIMEOUT" in err_str:
        return "timeout"
    if "404" in err_str or "NOT_FOUND" in err_str:
        return "model_not_found_404"
    if "CONNECTION" in err_str or "REMOTEPROTO" in err_str:
        return "connection_failure"
    return "internal_provider_error"


def stream_chat_response(
    message: str,
    history: list[dict],
    language: str = "om"
) -> Generator[Union[dict, str], None, None]:
    """
    Orchestrate AI chat streaming with Gemini as primary and Groq as automatic secondary fallback.
    Yields dictionary status updates (e.g. {'status': 'retrieving', ...}) and text chunks.
    """
    request_id = str(uuid.uuid4())[:8]
    t_start = time.time()
    logger.info(f"[ai_chat:{request_id}] Request started (lang={language}, history_turns={len(history)})")

    # 1. Deterministic fast-path for standard greetings (<50ms perceived latency)
    if is_simple_greeting(message, history):
        greeting = GREETINGS_BY_LANG.get(language, GREETINGS_BY_LANG["en"])
        logger.info(f"[ai_chat:{request_id}] Fast greeting served in {time.time() - t_start:.3f}s")
        words = greeting.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i + 3])
            if i + 3 < len(words):
                chunk += " "
            yield chunk
        return

    # 2. Yield conversational activity status
    product_intent_keywords = (
        "kemis", "dress", "outfit", "netela", "gabi", "find", "search",
        "show", "look", "price", "under", "birr", "etb", "color", "wear",
        "suit", "shemiz", "men", "women", "wedding", "buy", "shop", "tilf", "kaba"
    )
    has_product_intent = any(kw in message.lower() for kw in product_intent_keywords)
    if has_product_intent:
        yield {"status": "retrieving", "detail": "Finding the right pieces..."}
    else:
        yield {"status": "thinking", "detail": "Consulting Tilet3D atelier..."}

    tokens_emitted = False
    provider_used = None
    ttft = None
    gemini_error = None
    response_text = None

    # 3. Primary attempt: Gemini
    try:
        response_text = execute_gemini_chat(
            message=message,
            history=history,
            language=language,
            request_id=request_id
        )
        provider_used = "gemini"
    except Exception as exc:
        gemini_error = exc
        cat = categorize_error(exc)
        sanitized_err = sanitize_log_message(str(exc)[:120])
        logger.warning(f"[ai_chat:{request_id}] Gemini primary failed [category={cat}]: {sanitized_err}")

    # 4. Fallback attempt: Groq (if Gemini failed before emitting any answer tokens)
    if response_text is None and not tokens_emitted:
        is_recoverable = gemini_error is not None and is_recoverable_gemini_error(gemini_error)
        groq_configured = bool(getattr(settings, "GROQ_API_KEY", ""))

        if is_recoverable and groq_configured:
            logger.info(f"[ai_chat:{request_id}] Activating Groq secondary fallback (Gemini failure category: {categorize_error(gemini_error)})")
            try:
                response_text = execute_groq_chat(
                    message=message,
                    history=history,
                    language=language,
                    request_id=request_id
                )
                provider_used = "groq"
            except Exception as groq_exc:
                sanitized_groq_err = sanitize_log_message(str(groq_exc)[:140])
                logger.error(f"[ai_chat:{request_id}] Groq fallback also failed: {sanitized_groq_err}")
        elif not groq_configured:
            logger.info(f"[ai_chat:{request_id}] Groq fallback skipped: GROQ_API_KEY is not configured.")

    # 5. Emit response chunks if a provider succeeded
    if response_text is not None:
        duration = time.time() - t_start
        chunk_size = 28
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            if not tokens_emitted:
                tokens_emitted = True
                ttft = time.time() - t_start
                logger.info(
                    f"[ai_telemetry:{request_id}] provider={provider_used} "
                    f"fallback={'true' if provider_used == 'groq' else 'false'} "
                    f"ttft={ttft:.3f}s duration={duration:.3f}s text_len={len(response_text)}"
                )
            yield chunk
        return

    # 6. Controlled error response if both providers failed or were unavailable
    primary_err_str = str(gemini_error or "")
    if "RESOURCE_EXHAUSTED" in primary_err_str or "429" in primary_err_str:
        yield "The AI Concierge is currently handling high volume. Please try again in a few moments.\n\nPRODUCT_IDS: none"
    elif "503" in primary_err_str or "UNAVAILABLE" in primary_err_str or "504" in primary_err_str:
        yield "The AI Concierge is currently experiencing temporary high demand. Please try again in a moment.\n\nPRODUCT_IDS: none"
    else:
        yield "The AI Concierge encountered a temporary issue. Please tap Retry below to try again.\n\nPRODUCT_IDS: none"
