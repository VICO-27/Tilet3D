import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Sparkles, Send } from "lucide-react";
import PageLayout from "@/shared/components/layout/PageLayout";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "../components/ProductPreviewCard";

const SUGGESTIONS = [
  "What's new in Habesha Kemis?",
  "Find me a wedding outfit",
  "What colors are available in Netela?",
  "How does the 3D avatar try-on work?",
];

const AiConciergePage: React.FC = () => {
  const [input, setInput] = useState("");
  const { messages, isGenerating, send } = useAiChat(
    "Welcome to the Tilet3D Atelier. I'm your personal styling concierge — ask me about our collections, sizing, custom orders, or how the 3D try-on works."
  );
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  };

  const hasStarted = messages.length > 1;

  return (
    <PageLayout>
      <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
        <div className="flex-1 overflow-y-auto pt-24 pb-40">
          <div className="max-w-3xl mx-auto px-6">
            {!hasStarted && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
                  <Sparkles size={14} /> Tilet3D Atelier
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                  How can I help you today?
                </h1>
              </div>
            )}

            <div className="space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === "user" ? "flex justify-end" : ""}>
                  <div className={msg.role === "user" ? "max-w-[75%]" : "w-full"}>
                    <div
                      className={
                        msg.role === "user"
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-2xl rounded-br-sm px-5 py-3 text-sm"
                          : "text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap"
                      }
                    >
                      {msg.content || (msg.isStreaming ? "···" : "")}
                    </div>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {msg.products.map((p) => (
                          <ProductPreviewCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-neutral-950 via-white/95 dark:via-neutral-950/95 to-transparent pt-10 pb-6">
          <div className="max-w-3xl mx-auto px-6">
            {!hasStarted && (
              <div className="flex gap-2 overflow-x-auto mb-3 text-xs">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-amber-500 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl px-5 py-3 shadow-lg"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about styles, sizing, custom orders..."
                className="flex-1 bg-transparent border-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none py-2"
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AiConciergePage;