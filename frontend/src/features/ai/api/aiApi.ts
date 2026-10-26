import apiClient from "../../../shared/api/apiClient";

export interface StreamChatOptions {
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onStatus?: (status: string, detail?: string) => void;
  onError: (err: string, isAbort?: boolean) => void;
  onComplete: () => void;
}

export const aiApi = {
  // Streams a chat response from Gemini via SSE reader
  streamChat: async (
    message: string,
    history: Array<{ role: "user" | "model"; content: string }>,
    optionsOrOnChunk: StreamChatOptions | ((text: string) => void),
    legacyOnError?: (err: string) => void,
    legacyOnComplete?: () => void
  ) => {
    const options: StreamChatOptions = typeof optionsOrOnChunk === "function"
      ? {
          onChunk: optionsOrOnChunk,
          onError: legacyOnError || (() => {}),
          onComplete: legacyOnComplete || (() => {}),
        }
      : optionsOrOnChunk;

    const { signal, onChunk, onStatus, onError, onComplete } = options;

    try {
      const currentLang = localStorage.getItem("tilet3d_language") || "om";
      const token = localStorage.getItem("tilet3d_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiClient.defaults.baseURL || '/api'}/ai/chat/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message, history, language: currentLang }),
        signal,
      });

      if (!response.ok) {
        let errMessage = `Request failed with status ${response.status}`;
        if (response.status === 429) {
          errMessage = "Too many requests. Please wait a moment before sending another message.";
        } else if (response.status === 503) {
          errMessage = "The AI service is experiencing high demand. Please try again in a moment.";
        } else if (response.status === 401 || response.status === 403) {
          errMessage = "Authentication error. Please sign in again.";
        }
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.error || errData.message || errMessage;
        } catch {
          // Non-JSON response
        }
        onError(errMessage, false);
        return;
      }

      if (!response.body) {
        onError("No response body received from server", false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasError = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.replace("data: ", "");
            if (dataStr === "[DONE]") {
              if (!hasError) onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.status && onStatus) {
                onStatus(parsed.status, parsed.detail);
              }
              if (parsed.text) {
                onChunk(parsed.text);
              }
              if (parsed.error) {
                hasError = true;
                onError(parsed.error, false);
                return;
              }
            } catch {
              // Ignore parsing fragments silently
            }
          }
        }
      }
      if (!hasError) onComplete();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        onError("Generation stopped.", true);
        return;
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to AI assistant.";
      onError(errorMessage, false);
    }
  },

  // Fetch vector-based similar products
  getRecommendations: async (productId: string) => {
    const response = await apiClient.get(`/ai/recommend/${productId}/`);
    return response.data;
  },
  getProductsByIds: async (ids: string[]) => {
    if (ids.length === 0) return [];
    const response = await apiClient.post(`/ai/products-by-ids/`, { ids });
    return response.data;
  },

  aiSearch: async (query: string) => {
    const response = await apiClient.get(`/ai/search/`, { params: { q: query } });
    return response.data as { query: string; results: import("../../products/types").Product[] };
  },
};
