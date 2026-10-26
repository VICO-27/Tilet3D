import { useState, useCallback, useRef, useEffect } from "react";
import { aiApi } from "../api/aiApi";
import { Product } from "../../products/types";

export type ChatStatus = "idle" | "submitting" | "thinking" | "retrieving" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  products?: Product[];
  isStreaming?: boolean;
  status?: "thinking" | "retrieving" | "streaming" | "done" | "error";
  statusDetail?: string;
  error?: string;
  timestamp: number;
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial-greeting",
      role: "model",
      content: initialGreeting,
      status: "done",
      timestamp: 0,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStatus, setActiveStatus] = useState<ChatStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const productCache = useRef<Map<string, Product>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveStatus("idle");
    setStatusDetail("");
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      if (last.role === "model" && last.isStreaming) {
        next[next.length - 1] = {
          ...last,
          isStreaming: false,
          status: "done",
          content: last.content ? `${last.content} (stopped)` : "Response stopped.",
        };
      }
      return next;
    });
  }, []);

  const send = useCallback(
    async (userMessage: string): Promise<boolean> => {
      const trimmed = userMessage.trim();
      if (!trimmed || isGenerating) return false;

      // Create new AbortController
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Extract and bound conversation history to the last 8 turns
      const firstUserIdx = messages.findIndex((m) => m.role === "user");
      const validHistory = firstUserIdx !== -1
        ? messages.slice(firstUserIdx).map((m) => ({ role: m.role, content: m.content }))
        : [];
      const historyForApi = validHistory.slice(-8);

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `model-${Date.now() + 1}`;

      // Optimistic instant render (<10ms)
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        },
        {
          id: assistantMsgId,
          role: "model",
          content: "",
          isStreaming: true,
          status: "thinking",
          statusDetail: "Consulting Tilet3D atelier...",
          timestamp: Date.now() + 1,
        },
      ]);

      setIsGenerating(true);
      setActiveStatus("thinking");
      setStatusDetail("Consulting Tilet3D atelier...");
      lastFailedMessageRef.current = trimmed;

      let raw = "";

      await aiApi.streamChat(
        trimmed,
        historyForApi,
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            raw += chunk;
            const { displayText } = splitStreamedText(raw);
            setActiveStatus("streaming");
            setMessages((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.id === assistantMsgId);
              if (idx !== -1) {
                next[idx] = {
                  ...next[idx],
                  content: displayText,
                  isStreaming: true,
                  status: "streaming",
                  statusDetail: "",
                };
              }
              return next;
            });
          },
          onStatus: (status, detail) => {
            const castStatus = status as ChatStatus;
            setActiveStatus(castStatus);
            if (detail) setStatusDetail(detail);
            setMessages((prev) => {
              const next = [...prev];
              const idx = next.findIndex((m) => m.id === assistantMsgId);
              if (idx !== -1) {
                next[idx] = {
                  ...next[idx],
                  status: status === "retrieving" ? "retrieving" : "thinking",
                  statusDetail: detail || next[idx].statusDetail,
                };
              }
              return next;
            });
          },
          onError: (err, isAbort) => {
            if (isAbort) {
              setMessages((prev) => {
                const next = [...prev];
                const idx = next.findIndex((m) => m.id === assistantMsgId);
                if (idx !== -1) {
                  next[idx] = {
                    ...next[idx],
                    content: next[idx].content ? `${next[idx].content} (stopped)` : "Response stopped.",
                    isStreaming: false,
                    status: "done",
                  };
                }
                return next;
              });
            } else {
              setMessages((prev) => {
                const next = [...prev];
                const idx = next.findIndex((m) => m.id === assistantMsgId);
                if (idx !== -1) {
                  next[idx] = {
                    ...next[idx],
                    content: `Sorry, I hit an issue (${err}). You can tap Retry below to try again.`,
                    isStreaming: false,
                    status: "error",
                    error: err,
                  };
                }
                return next;
              });
              setActiveStatus("error");
            }
            setIsGenerating(false);
          },
          onComplete: async () => {
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
              const idx = next.findIndex((m) => m.id === assistantMsgId);
              if (idx !== -1) {
                next[idx] = {
                  ...next[idx],
                  content: displayText || "I'm here to help. What style, occasion, or size are you looking for today?",
                  products,
                  isStreaming: false,
                  status: "done",
                  statusDetail: "",
                };
              }
              return next;
            });
            setIsGenerating(false);
            setActiveStatus("idle");
            setStatusDetail("");
            lastFailedMessageRef.current = null;
          },
        }
      );

      return true;
    },
    [messages, isGenerating]
  );

  const retry = useCallback(async () => {
    if (isGenerating) return;
    const toRetry = lastFailedMessageRef.current;
    if (!toRetry) {
      // Find the last user message
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (lastUser && lastUser.content) {
        await send(lastUser.content);
      }
      return;
    }
    // Remove the trailing error model message and re-send
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].role === "model" && prev[prev.length - 1].status === "error") {
        return prev.slice(0, -1);
      }
      return prev;
    });
    await send(toRetry);
  }, [messages, isGenerating, send]);

  return {
    messages,
    isGenerating,
    activeStatus,
    statusDetail,
    send,
    stop,
    retry,
  };
}