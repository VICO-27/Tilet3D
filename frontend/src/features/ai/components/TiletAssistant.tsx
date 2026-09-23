import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "./ProductPreviewCard";

const QUICK_PROMPTS = ["What's new?", "Help me pick an outfit", "How does try-on work?"];

export const TiletAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isGenerating, send } = useAiChat(
    "Hi! I'm the Tilet3D assistant. Ask me about products, sizing, or how the site works."
  );
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 bg-neutral-900/90 text-white px-5 py-3.5 rounded-full shadow-2xl backdrop-blur-xl border border-white/10 transition-all duration-300 hover:scale-105 hover:bg-black"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-sm font-medium tracking-wide">Ask Tilet3D</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[600px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-white text-xs font-bold">
                T3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Tilet Concierge</h3>
                <button onClick={() => navigate("/ai-concierge")} className="text-[11px] text-amber-600 hover:underline">
                  Open full chat →
                </button>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-br-none"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-none"
                  }`}
                >
                  {msg.content || (msg.isStreaming ? "···" : "")}
                </div>
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 space-y-2 w-full max-w-[85%]">
                    {msg.products.slice(0, 3).map((p) => (
                      <ProductPreviewCard key={p.id} product={p} compact />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-neutral-100 dark:border-neutral-800 text-xs">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a quick question..."
              className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 rounded-xl font-medium text-sm disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};