import json
import logging
import time
from typing import Optional
from django.conf import settings
from apps.ai.services.gemini_client import search_store, get_system_instruction

logger = logging.getLogger("apps.ai.groq")

GROQ_STORE_TOOL = {
    "type": "function",
    "function": {
        "name": "search_store",
        "description": "Search the Tilet3D luxury product database using advanced filters. Call this tool whenever the customer is looking for specific clothing items, prices, styles, colors, or categories.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "General text search term."
                },
                "category": {
                    "type": "string",
                    "description": "Product category (e.g., 'Kemis', 'Netela', 'Gabi', 'Shash', 'Tilf', 'Mens', 'Kaba')."
                },
                "min_price": {
                    "type": "number",
                    "description": "Minimum price in ETB."
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price in ETB."
                },
                "color": {
                    "type": "string",
                    "description": "Product color (e.g., 'White', 'Black', 'Gold', 'Red', 'Blue', 'Green')."
                },
                "gender": {
                    "type": "string",
                    "description": "Target gender ('Women', 'Men', 'Unisex')."
                },
                "availability": {
                    "type": "string",
                    "description": "Set to 'in_stock' for available items."
                },
                "sort": {
                    "type": "string",
                    "description": "Sort order ('price_asc', 'price_desc', 'newest')."
                }
            }
        }
    }
}


class GroqConfigurationError(Exception):
    """Raised when Groq is not configured or missing API key."""
    pass


class GroqProviderError(Exception):
    """Raised when Groq API call fails."""
    pass


def get_groq_client():
    """Instantiate and return the Groq SDK client if API key is present."""
    api_key = getattr(settings, "GROQ_API_KEY", "")
    if not api_key:
        return None
    try:
        from groq import Groq
        timeout = getattr(settings, "GROQ_TIMEOUT", 15)
        return Groq(api_key=api_key, timeout=timeout)
    except Exception as exc:
        logger.error(f"[groq_client] Failed to initialize Groq client: {exc}")
        return None


def execute_groq_chat(
    message: str,
    history: list[dict],
    language: str = "om",
    request_id: Optional[str] = None
) -> str:
    """
    Generate a response from Groq using tool-calling and catalog grounding.
    Returns the complete generated response text.
    """
    client = get_groq_client()
    if not client:
        raise GroqConfigurationError("GROQ_API_KEY is not configured.")

    t_start = time.time()
    req_label = request_id or "unknown"
    model_name = getattr(settings, "GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
    logger.info(f"[groq_chat:{req_label}] Starting fallback generation with model={model_name} lang={language}")

    # Build system instructions and messages in OpenAI format
    system_instruction = get_system_instruction(language=language)
    groq_messages = [
        {"role": "system", "content": system_instruction}
    ]

    # Bound conversation history to last 8 turns
    bounded_history = history[-8:] if len(history) > 8 else list(history)
    for turn in bounded_history:
        role = turn.get("role")
        content = turn.get("content", "")
        if not content:
            continue
        if role == "user":
            groq_messages.append({"role": "user", "content": content})
        elif role in ("model", "assistant"):
            groq_messages.append({"role": "assistant", "content": content})

    # In conversational turn ordering, avoid starting history with assistant message
    while len(groq_messages) > 1 and groq_messages[1]["role"] == "assistant":
        groq_messages.pop(1)

    groq_messages.append({"role": "user", "content": message})

    # Tool calling loop (max 2 iterations to prevent infinite loops)
    max_tool_iterations = 2
    response_text = None

    for iteration in range(max_tool_iterations):
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=groq_messages,
                tools=[GROQ_STORE_TOOL],
                tool_choice="auto",
                temperature=0.3
            )
        except Exception as exc:
            err_str = str(exc)
            logger.error(f"[groq_chat:{req_label}] Groq completion call failed: {err_str[:160]}")
            raise GroqProviderError(f"Groq API error: {err_str[:120]}") from exc

        response_msg = completion.choices[0].message
        tool_calls = getattr(response_msg, "tool_calls", None)

        if tool_calls:
            logger.info(f"[groq_chat:{req_label}] Groq initiated {len(tool_calls)} tool call(s) in iteration {iteration + 1}")
            
            # Append the assistant message with tool calls to conversation
            assistant_turn = {
                "role": "assistant",
                "content": response_msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in tool_calls
                ]
            }
            groq_messages.append(assistant_turn)

            for tc in tool_calls:
                func_name = tc.function.name
                func_args_raw = tc.function.arguments or "{}"
                
                try:
                    args = json.loads(func_args_raw)
                    if not isinstance(args, dict):
                        args = {}
                except Exception as parse_err:
                    logger.warning(f"[groq_chat:{req_label}] Malformed tool arguments: {parse_err}")
                    args = {}

                if func_name == "search_store":
                    try:
                        tool_result = search_store(
                            query=args.get("query"),
                            category=args.get("category"),
                            min_price=args.get("min_price"),
                            max_price=args.get("max_price"),
                            color=args.get("color"),
                            gender=args.get("gender"),
                            availability=args.get("availability"),
                            sort=args.get("sort"),
                        )
                    except Exception as store_err:
                        logger.error(f"[groq_chat:{req_label}] Error executing search_store: {store_err}")
                        tool_result = json.dumps({"error": "Catalog query failed."})
                else:
                    tool_result = json.dumps({"error": f"Unknown tool: {func_name}"})

                groq_messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": func_name,
                    "content": tool_result
                })
        else:
            # Model responded directly with text without calling any tools
            response_text = response_msg.content or ""
            break

    # If the tool iteration finished without a final text response, request the final synthesis
    if response_text is None:
        try:
            final_completion = client.chat.completions.create(
                model=model_name,
                messages=groq_messages,
                temperature=0.3
            )
            response_text = final_completion.choices[0].message.content or ""
        except Exception as exc:
            err_str = str(exc)
            logger.error(f"[groq_chat:{req_label}] Groq final synthesis failed: {err_str[:160]}")
            raise GroqProviderError(f"Groq API error on synthesis: {err_str[:120]}") from exc

    # Ensure response ends with PRODUCT_IDS line if missing
    clean_text = response_text.strip()
    if "PRODUCT_IDS:" not in clean_text:
        clean_text += "\n\nPRODUCT_IDS: none"

    duration = time.time() - t_start
    logger.info(f"[groq_chat:{req_label}] Completed Groq response in {duration:.3f}s (len={len(clean_text)})")
    return clean_text
