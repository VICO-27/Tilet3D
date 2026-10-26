import json
import logging
import time
import uuid
from google import genai
from google.genai import types
from google.genai.errors import APIError
from django.conf import settings
from apps.products.models import Product
from apps.products.services.search import search_products

logger = logging.getLogger("apps.ai")

CHAT_MODEL = getattr(settings, "GEMINI_CHAT_MODEL", "gemini-3.8-flash")
EMBEDDING_MODEL = "gemini-embedding-001"

# Curated deterministic greetings for instantaneous perceived performance (<50ms)
GREETINGS_BY_LANG = {
    "en": "Welcome to Tilet3D. I am your personal styling concierge. I can help you discover bespoke Habesha Kemis, traditional wedding attire, or explore our 3D avatar fitting room. How may I assist you today?\n\nPRODUCT_IDS: none",
    "am": "እንኳን ወደ ጥላ 3D (Tilet3D) በደህና መጡ። እኔ የእርስዎ የግል ፋሽን አማካሪ ነኝ። ምርጥ የሐበሻ ቀሚሶችን፣ የሠርግ አልባሳትን እንዲመርጡ ወይም በ3D አምሳያ እንዲሞክሩ ልረዳዎ እችላለሁ። ዛሬ ምን ላቅርብልዎ?\n\nPRODUCT_IDS: none",
    "om": "Baga gara Tilet3D nagaan dhuftan. Ani gorsaa fi qindeessaa uffata aadaa keessaniiti. Uffata aadaa Oromoo fi Habashaa filachuu, yookiin kutaa 3D keessatti of irratti yaaluuf akkamitti si gargaaruu danda'a?\n\nPRODUCT_IDS: none",
    "ti": "እንቋዕ ናብ ጥላ 3D ብደሓን መጻእኩም። ኣነ ናይ ውልቀ ፋሽን አማኻሪኹም እየ። ጽሩይ ናይ ሓበሻ ቀሚስ፣ መርዓ አልባሳትን ብ3D ከምኡ'ውን ምኽሪ ክህበኩም ድሉው እየ። ሎሚ ብምንታይ ክሕግዘኩም?\n\nPRODUCT_IDS: none",
    "fr": "Bienvenue chez Tilet3D. Je suis votre concierge de style personnel. Je peux vous aider à découvrir des tenues traditionnelles éthiopiennes d'exception et notre cabine d'essayage 3D. Comment puis-je vous aider aujourd'hui ?\n\nPRODUCT_IDS: none",
    "ar": "مرحبًا بكم في Tilet3D. أنا مستشاركم ومساعدكم للأزياء الإثيوبية الفاخرة. يمكنني مساعدتكم في اكتشاف أجمل فساتين الحبيشا والأزياء التراثية أو تجربة غرفة القياس ثلاثية الأبعاد. كيف يمكنني خدمتكم اليوم؟\n\nPRODUCT_IDS: none",
    "sw": "Karibu Tilet3D. Mimi ni mshauri wako wa mitindo ya mavazi ya asili ya Ethiopia. Ninaweza kukusaidia kuchagua mavazi ya kitamaduni na kutumia chumba chetu cha majaribio cha 3D. Nawezaje kukusaidia leo?\n\nPRODUCT_IDS: none",
}

GREETING_WORDS = {
    "hi", "hello", "hey", "hola", "bonjour", "selam", "salam", "akkam",
    "akkammit", "akkamta", "halo", "help", "good morning", "good afternoon",
    "good evening", "greetings", "dehna", "kemey"
}


def is_simple_greeting(message: str, history: list[dict]) -> bool:
    clean = message.strip().lower().rstrip("!.,? ")
    user_turns = [turn for turn in history if turn.get("role") == "user"]
    if len(user_turns) > 0:
        return False
    return clean in GREETING_WORDS


def get_client():
    if not getattr(settings, 'GEMINI_API_KEY', None):
        return None
    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=25000,
            retry_options=types.HttpRetryOptions(attempts=1)
        )
    )


def search_store(
    query: str = None,
    category: str = None,
    min_price: float = None,
    max_price: float = None,
    color: str = None,
    gender: str = None,
    availability: str = None,
    sort: str = None
) -> str:
    """
    Search the Tilet3D luxury product database using advanced filters.
    
    Args:
        query: General text search term.
        category: Product category (e.g., 'Kemis', 'Netela', 'Gabi', 'Shash', 'Tilf', 'Mens', 'Kaba').
        min_price: Minimum price in ETB. (Budget: <2000, Mid: 2000-6000, Premium: >6000)
        max_price: Maximum price in ETB.
        color: Product color (e.g., 'White', 'Black', 'Gold', 'Red', 'Blue', 'Green').
        gender: Target gender (e.g., 'Women', 'Men', 'Unisex').
        availability: Set to 'in_stock' for available items.
        sort: Sort order ('price_asc', 'price_desc', 'newest').
    """
    t_start = time.time()
    try:
        # Pre-fetch variants to eliminate N+1 roundtrips over remote database
        qs = search_products(
            query=query, category=category, min_price=min_price,
            max_price=max_price, color=color, gender=gender,
            availability=availability, sort=sort
        ).prefetch_related("variants")
        
        # Take top 8 concise results to keep model prompts fast and relevant
        products = list(qs[:8])
        if not products:
            return json.dumps({"results": "No products match these filters."})
            
        results = []
        for p in products:
            variants = list(p.variants.all())
            variant = variants[0] if variants else None
            price = float(variant.price) if variant and variant.price is not None else None
            color_val = variant.color if variant and variant.color else None
            cat_name = p.category.name if hasattr(p, 'category') and p.category else "Cultural Wear"
            results.append({
                "id": str(p.id),
                "name": p.name,
                "category": cat_name,
                "price_etb": price,
                "color": color_val,
                "description": p.description[:80]
            })
        duration = time.time() - t_start
        logger.info(f"[search_store] query={query!r} returned {len(results)} items in {duration:.3f}s")
        return json.dumps({"results": results})
    except Exception as e:
        logger.error(f"[search_store] error: {e}")
        return json.dumps({"error": str(e)})


def get_system_instruction(language: str = "om") -> str:
    lang_names = {
        "om": "Afaan Oromoo (Oromo)",
        "am": "Amharic (አማርኛ)",
        "ti": "Tigrinya (ትግርኛ)",
        "en": "English",
        "fr": "French (Français)",
        "ar": "Arabic (العربية)",
        "sw": "Swahili (Kiswahili)",
    }
    target_lang = lang_names.get(language, "Afaan Oromoo or the language user speaks")
    return (
        "You are the Tilet3D luxury concierge, helping customers find Ethiopian cultural clothing "
        "(habesha kemis, netela, gabi, shemiz, etc.) on an immersive 3D e-commerce platform. "
        "Be warm, sophisticated, and concise (Apple-grade tone), 2-4 sentences per reply unless asked for detail.\n\n"
        f"MULTILINGUAL INTELLIGENCE:\n"
        f"- The customer's active language preference is {target_lang}.\n"
        "- Fluently understand and converse in Afaan Oromoo, Amharic (አማርኛ), Tigrinya (ትግርኛ), English, French, Arabic (العربية), and Swahili (Kiswahili).\n"
        "- Reply in the language requested by the user, defaulting to their preference if not specified. If they ask in Amharic, reply in fluent Amharic script. If they ask in Afaan Oromoo, reply in natural, authentic Afaan Oromoo. If they ask in Tigrinya, reply in accurate Tigrinya script. If in Arabic, reply in elegant modern standard Arabic.\n"
        "- Never invent translations of technical product measurements or prices (always retain prices in ETB).\n"
        "- Never use em-dashes ('—') or double dashes ('--') in your generated replies. Use standard natural punctuation (commas, periods) instead.\n\n"
        "You have access to the `search_store` tool. You MUST use it whenever the user asks to find, show, or look for products, "
        "especially when they specify prices, colors, categories, or sorting. "
        "Do not invent products. Always use the search tool to find real inventory.\n\n"
        "When you recommend specific products from the search results, you MUST end your "
        "entire reply with exactly one line in this format (nothing after it):\n"
        "PRODUCT_IDS: id1,id2,id3\n"
        "Use the exact IDs from the search results, comma-separated. "
        "If you mentioned no specific products, end with: PRODUCT_IDS: none\n"
    )


class AIOfflineError(Exception):
    """Raised when the AI service is unavailable."""
    pass


def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    client = get_client()
    if not client:
        raise AIOfflineError("AI embedding service is offline (missing key).")
    
    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        return list(result.embeddings[0].values)
    except Exception as e:
        raise AIOfflineError(f"Embedding failed: {str(e)}")


def stream_chat_response(message: str, history: list[dict], language: str = "om"):
    client = get_client()
    if not client:
        yield "AI Assistant is currently offline. Please set GEMINI_API_KEY.\n\nPRODUCT_IDS: none"
        return

    request_id = str(uuid.uuid4())[:8]
    t_start = time.time()
    logger.info(f"[ai_chat:{request_id}] Request start: lang={language} history_len={len(history)}")

    # Deterministic fast-path for simple greetings (<50ms perceived latency)
    if is_simple_greeting(message, history):
        greeting = GREETINGS_BY_LANG.get(language, GREETINGS_BY_LANG["en"])
        logger.info(f"[ai_chat:{request_id}] Served fast greeting in {time.time() - t_start:.3f}s")
        words = greeting.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i + 3])
            if i + 3 < len(words):
                chunk += " "
            yield chunk
        return

    # Check for product intent keywords to provide immediate, truthful retrieval feedback
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

    try:
        # Bound conversation history to last 8 turns to control latency and token usage
        bounded_history = history[-8:] if len(history) > 8 else list(history)
        history_contents = [
            types.Content(role=turn["role"], parts=[types.Part(text=turn["content"])])
            for turn in bounded_history
            if turn.get("content") and turn.get("role") in ("user", "model")
        ]
        # In Gemini multi-turn chat, the conversation must begin with a user turn
        while history_contents and history_contents[0].role != "user":
            history_contents.pop(0)

        # Primary model and resilient fallback model
        primary_model = getattr(settings, "GEMINI_CHAT_MODEL", "gemini-3.8-flash")
        fallback_model = "gemini-3.5-flash" if primary_model != "gemini-3.5-flash" else None
        models_to_try = [primary_model]
        if fallback_model:
            models_to_try.append(fallback_model)

        response_text = None
        last_error = None

        for model_name in models_to_try:
            try:
                chat = client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=get_system_instruction(language=language),
                        tools=[search_store],
                        temperature=0.3
                    ),
                    history=history_contents
                )

                response = chat.send_message(message)
                response_text = response.text or ""
                break
            except Exception as exc:
                last_error = exc
                err_str = str(exc)
                logger.warning(f"[ai_chat:{request_id}] Model {model_name} failed: {err_str[:120]}")
                if "503" in err_str or "UNAVAILABLE" in err_str or "504" in err_str or "DEADLINE" in err_str:
                    # Provider demand spike, try fallback model
                    continue
                else:
                    break

        if response_text is None:
            if last_error:
                raise last_error
            response_text = "I apologize, but I could not find a suitable recommendation right now. Please try again.\n\nPRODUCT_IDS: none"

        total_time = time.time() - t_start
        logger.info(f"[ai_chat:{request_id}] Completed generation in {total_time:.3f}s (len={len(response_text)})")

        # Yield response in chunks for smooth SSE transmission
        chunk_size = 28
        for i in range(0, len(response_text), chunk_size):
            yield response_text[i:i + chunk_size]

    except Exception as exc:
        err_msg = str(exc)
        logger.error(f"[ai_chat:{request_id}] Error in chat stream: {err_msg[:200]}")
        if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            yield "The AI Concierge has reached the daily free tier request limit. Please try again later.\n\nPRODUCT_IDS: none"
        elif "503" in err_msg or "UNAVAILABLE" in err_msg or "504" in err_msg:
            yield "The AI Concierge is currently experiencing temporary high demand from Google. Please try again in a moment.\n\nPRODUCT_IDS: none"
        else:
            yield f"The AI Concierge encountered an issue: {err_msg[:100]}. Please try again.\n\nPRODUCT_IDS: none"