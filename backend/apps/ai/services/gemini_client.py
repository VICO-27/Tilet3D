import json
from google import genai
from google.genai import types
from django.conf import settings
from apps.products.models import Product

client = genai.Client(api_key=settings.GEMINI_API_KEY)

CHAT_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"

def _get_product_catalog_context() -> str:
    products = Product.objects.filter(is_active=True)[:40]
    if not products:
        return "No specific products currently loaded."
    
    catalog_lines = []
    for p in products:
        variant = p.variants.first()
        price = variant.price if variant else "Bespoke"
        cat_name = p.category.name if hasattr(p, 'category') and p.category else "Cultural Wear"
        catalog_lines.append(f"ID: {p.id} | Name: {p.name} | Category: {cat_name} | Price: {price} ETB | Description: {p.description[:80]}")
    return "\n".join(catalog_lines)

def get_system_instruction() -> str:
    product_context = _get_product_catalog_context()
    return (
        "You are the Tilet3D luxury concierge, helping customers find Ethiopian cultural clothing "
        "(habesha kemis, netela, gabi, shemiz, etc.) on an immersive 3D e-commerce platform. "
        "Be warm, sophisticated, and concise (Apple-grade tone) — 2-4 sentences per reply unless asked for detail.\n\n"
        "When you mention or recommend specific products from STORE INVENTORY below, you MUST end your "
        "entire reply with exactly one line in this format (nothing after it):\n"
        "PRODUCT_IDS: id1,id2,id3\n"
        "Use the exact IDs from STORE INVENTORY, comma-separated, no brackets, no extra text on that line. "
        "If you mentioned no specific products, end with: PRODUCT_IDS: none\n"
        "Never invent products, prices, or stock that aren't in STORE INVENTORY.\n\n"
        f"STORE INVENTORY:\n{product_context}"
    )

def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return list(result.embeddings[0].values)

def stream_chat_response(message: str, history: list[dict]):
    contents = [
        types.Content(role=turn["role"], parts=[types.Part(text=turn["content"])])
        for turn in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    stream = client.models.generate_content_stream(
        model=CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=get_system_instruction()),
    )

    for chunk in stream:
        if chunk.text:
            yield chunk.text