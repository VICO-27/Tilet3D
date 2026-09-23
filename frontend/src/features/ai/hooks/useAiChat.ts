import { useState, useCallback, useRef } from "react";
import { aiApi } from "../api/aiApi";
import { Product } from "../../products/types";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  products?: Product[];
  isStreaming?: boolean;
}

const PRODUCT_IDS_REGEX = /\n?PRODUCT_IDS:\s*([^\n]*)/i;

function splitStreamedText(raw: string) {
  const match = raw.match(PRODUCT_IDS_REGEX);
  const displayText = raw.replace(PRODUCT_IDS_REGEX, "").trim();
  let ids: string[] = [];
  if (match && match[1] && match[1].trim().toLowerCase() !== "none") {
    ids = match[1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return { displayText, ids };
}

export function useAiChat(initialGreeting: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", content: initialGreeting },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const productCache = useRef<Map<string, Product>>(new Map());

  const send = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed || isGenerating) return;

      const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "model", content: "", isStreaming: true },
      ]);
      setIsGenerating(true);

      let raw = "";

      await aiApi.streamChat(
        trimmed,
        historyForApi,
        (chunk) => {
          raw += chunk;
          const { displayText } = splitStreamedText(raw);
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "model", content: displayText, isStreaming: true };
            return next;
          });
        },
        (err) => {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "model",
              content: `Sorry — I hit a connection issue (${err}). Please try again.`,
            };
            return next;
          });
          setIsGenerating(false);
        },
        async () => {
          const { displayText, ids } = splitStreamedText(raw);
          let products: Product[] = [];

          if (ids.length > 0) {
            const uncached = ids.filter((id) => !productCache.current.has(id));
            if (uncached.length > 0) {
              try {
                const fetched: Product[] = await aiApi.getProductsByIds(uncached);
                fetched.forEach((p) => productCache.current.set(p.id, p));
              } catch {
                /* card rendering degrades gracefully to text-only */
              }
            }
            products = ids
              .map((id) => productCache.current.get(id))
              .filter((p): p is Product => Boolean(p));
          }

          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "model",
              content: displayText,
              products,
              isStreaming: false,
            };
            return next;
          });
          setIsGenerating(false);
        }
      );
    },
    [messages, isGenerating]
  );

  return { messages, isGenerating, send };
}