import json
from google import genai
from google.genai import types
from google.genai.errors import APIError
from django.conf import settings
from apps.products.models import Product
from apps.products.services.search import search_products

CHAT_MODEL = "gemini-3.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"

def get_client():
    if not getattr(settings, 'GEMINI_API_KEY', None):
        return None
    return genai.Client(api_key=settings.GEMINI_API_KEY)

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
    try:
        # Convert float to int for DB if necessary, or pass through
        qs = search_products(
            query=query, category=category, min_price=min_price,
            max_price=max_price, color=color, gender=gender,
            availability=availability, sort=sort
        )
        
        # Take top 15 results
        products = qs[:15]
        if not products:
            return json.dumps({"results": "No products match these filters."})
            
        results = []
        for p in products:
            variant = p.variants.first()
            price = float(variant.price) if variant else None
            cat_name = p.category.name if hasattr(p, 'category') and p.category else "Cultural Wear"
            results.append({
                "id": str(p.id),
                "name": p.name,
                "category": cat_name,
                "price_etb": price,
                "description": p.description[:100]
            })
        return json.dumps({"results": results})
    except Exception as e:
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
        yield "AI Assistant is currently offline. Please set GEMINI_API_KEY."
        return

    try:
        contents = [
            types.Content(role=turn["role"], parts=[types.Part(text=turn["content"])])
            for turn in history
        ]
        contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

        # We will use chats to let the SDK handle the tool call loop automatically
        chat = client.chats.create(
            model=CHAT_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=get_system_instruction(language=language),
                tools=[search_store],
                temperature=0.3
            )
        )
        # Manually populate history (skip the last user message, we will send it)
        chat._history = contents[:-1]
        
        # Send user message and execute tools automatically
        response = chat.send_message(message)
        text = response.text or ""
        
        # Yield in chunks for smooth SSE streaming to the client
        chunk_size = 28
        for i in range(0, len(text), chunk_size):
            yield text[i:i + chunk_size]
    except Exception as exc:
        err_msg = str(exc)
        if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            yield "The AI Concierge is currently handling high volume on the free tier. Please retry in a few moments.\n\nPRODUCT_IDS: none"
        else:
            raise