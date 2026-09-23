import apiClient from "../../../shared/api/apiClient";

export const aiApi = {
  // Streams a chat response from Gemini via SSE reader
  streamChat: async (
    message: string,
    history: Array<{ role: "user" | "model"; content: string }>,
    onChunk: (text: string) => void,
    onError: (err: string) => void,
    onComplete: () => void
  ) => {
    try {
      const response = await fetch(`${apiClient.defaults.baseURL || '/api'}/ai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.body) throw new Error("No response body from stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) onChunk(parsed.text);
              if (parsed.error) onError(parsed.error);
            } catch {
              // Ignore parsing fragments silently
            }
          }
        }
      }
      onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to AI assistant.";
      onError(errorMessage);
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
