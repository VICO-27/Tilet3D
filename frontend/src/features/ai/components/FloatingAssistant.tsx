import React, { useRef, useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Sparkles, Send, X, ArrowUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssistantStore } from "../store/useAssistantStore";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "./ProductPreviewCard";

const SUGGESTIONS = [
  "Find white Habesha dresses under 3000 birr",
  "Show me men's outfits",
  "Help me choose a style",
  "Open my Avatar Studio",
];

export const FloatingAssistant: React.FC = () => {
  const { isOpen, isMinimized, closeAssistant, minimizeAssistant, openAssistant } = useAssistantStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, isGenerating, send } = useAiChat(
    "Welcome to Tilet3D AI. I'm your personal styling concierge — ask me about our collections, sizing, or custom orders."
  );

  const hasStarted = messages.length > 1;

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, isGenerating, isOpen, isMinimized]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    
    // Simple command handling for context actions
    if (text.toLowerCase().includes("avatar studio")) {
      navigate("/avatar");
    } else if (text.toLowerCase().includes("cart")) {
      // Logic to open cart could go here, for now just answer normally
    }

    send(text);
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      closeAssistant();
    }
  };

  return (
    <>
      <AnimatePresence>
        {/* ======================= EXPANDED BOTTOM SHEET ======================= */}
        {isOpen && !isMinimized && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAssistant}
              className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm"
            />

            {/* Assistant Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="fixed bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-8 z-[60] w-full md:w-[420px] h-[85vh] md:h-[650px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-stone-200 dark:border-white/10 md:rounded-3xl rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden touch-none"
            >
              {/* Drag Handle & Header */}
              <div className="shrink-0 pt-3 pb-2 px-6 flex flex-col items-center border-b border-stone-100 dark:border-white/5">
                <div className="w-10 h-1.5 bg-stone-200 dark:bg-white/20 rounded-full mb-3 cursor-grab active:cursor-grabbing" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold tracking-tight">
                    <Sparkles className="w-4 h-4 text-plum-600" />
                    Tilet3D AI
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={closeAssistant} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scroll-smooth touch-pan-y">
                {!hasStarted && (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 bg-plum-50 dark:bg-plum-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-plum-100 dark:border-plum-800">
                      <Sparkles className="w-5 h-5 text-plum-600 dark:text-plum-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">How can I help you?</h2>
                    <p className="text-sm text-stone-500 mb-6">Ask about collections, fit, or styling advice.</p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-white/5 hover:bg-plum-50 hover:text-plum-700 border border-stone-200 dark:border-white/10 rounded-xl transition-colors text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#161616] text-white rounded-br-sm"
                          : "bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.content || (msg.isStreaming ? "···" : "")}
                    </div>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-3 w-full max-w-[95%]">
                        {msg.products.map((p) => (
                          <ProductPreviewCard key={p.id} product={p} compact />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex items-start">
                    <div className="px-4 py-3 bg-stone-100 dark:bg-white/10 rounded-2xl rounded-bl-sm text-stone-500 text-sm flex gap-1">
                      <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={endRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="shrink-0 p-4 bg-white dark:bg-neutral-900 border-t border-stone-100 dark:border-white/5">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-end gap-2 bg-stone-100 dark:bg-white/10 rounded-3xl pl-4 pr-1.5 py-1.5 border border-stone-200/50 dark:border-white/10 focus-within:bg-white focus-within:ring-2 focus-within:ring-plum-100 transition-all"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Tilet3D anything..."
                    className="flex-1 bg-transparent border-none text-[15px] text-stone-900 dark:text-white placeholder-stone-500 focus:outline-none py-2.5 min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !input.trim()}
                    className="shrink-0 w-10 h-10 bg-plum-600 hover:bg-plum-700 disabled:bg-stone-300 dark:disabled:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  >
                    <ArrowUp strokeWidth={2.5} size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
