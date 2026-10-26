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

logger = logging.getLogger("apps.ai.gemini")

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
            timeout=12000,
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


def execute_gemini_chat(
    message: str,
    history: list[dict],
    language: str = "om",
    request_id: str = None
) -> str:
    """
    Generate complete chat response from Gemini using catalog tool grounding.
    Raises exception on failure to allow orchestrator fallback.
    """
    client = get_client()
    if not client:
        raise AIOfflineError("Gemini client is offline (missing GEMINI_API_KEY).")

    req_label = request_id or "unknown"
    t_start = time.time()

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

    # Primary model and resilient fallback candidates that have capacity and support function calling
    primary_model = getattr(settings, "GEMINI_CHAT_MODEL", "gemini-3.8-flash")
    fallback_candidates = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"]
    models_to_try = [primary_model] + [m for m in fallback_candidates if m != primary_model]

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
            logger.warning(f"[ai_chat:{req_label}] Model {model_name} failed: {err_str[:120]}")
            continue

    if response_text is None:
        if last_error:
            raise last_error
        response_text = "I apologize, but I could not find a suitable recommendation right now. Please try again.\n\nPRODUCT_IDS: none"

    clean_text = response_text.strip()
    if "PRODUCT_IDS:" not in clean_text:
        clean_text += "\n\nPRODUCT_IDS: none"

    duration = time.time() - t_start
    logger.info(f"[ai_chat:{req_label}] Gemini completed generation in {duration:.3f}s (len={len(clean_text)})")
    return clean_text


def stream_chat_response(message: str, history: list[dict], language: str = "om"):
    """
    Backwards-compatible wrapper delegating to the multi-provider orchestrator.
    """
    from apps.ai.services.orchestrator import stream_chat_response as orchestrator_stream
    yield from orchestrator_stream(message, history, language=language)