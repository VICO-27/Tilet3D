// Two distinct states (matching the Gemini phone UI from the screenshots):
// 
//  IDLE (pill only):
//  ─────────────────────────────────────
//     [current Tilet3D page — fully visible]
//
//          ╭──────────────────────────╮
//          │ ✦  Ask Tilet3D...   🎙  |||│
//          ╰──────────────────────────╯
//
//
//  EXPANDED (conversation card floats above the pill):
//  ─────────────────────────────────────
//                     ╭──────────────╮
//                     │ ← Minimise  │  (top-right float)
//                     ╰──────────────╯
//
//          ╭──────────────────────────╮
//          │  ✦  conversation         │
//          │     products             │
//          │                          │
//          ╰──────────────────────────╯
//
//          ╭──────────────────────────╮
//          │ ✦  Ask Tilet3D...   🎙  |||│  ← still here, always
//          ╰──────────────────────────╯

import React, { useRef, useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Mic, ArrowUp, ChevronDown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssistantStore } from "../store/useAssistantStore";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "./ProductPreviewCard";

// ─── Context-aware suggestions keyed by route prefix ────────────────────────
const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/products/": ["Tell me about this outfit", "Find similar styles", "Check size guide", "Try this on"],
  "/products":  ["Find white Habesha dresses under 3000 birr", "Show men's outfits", "Show new arrivals", "Under 2000 ETB"],
  "/avatar":    ["Help me choose an outfit", "Find styles for my body type", "Try traditional styles"],
  "/cart":      ["Review my cart", "Find cheaper alternatives", "Check similar products"],
  "/":          ["Find white Habesha dresses", "Show men's outfits", "Help me choose a style"],
};

function getSuggestions(pathname: string): string[] {
  const key = Object.keys(ROUTE_SUGGESTIONS).find((k) => pathname.startsWith(k) && k !== "/");
  return ROUTE_SUGGESTIONS[key ?? "/"];
}

// ─── Animated AI Orb ─────────────────────────────────────────────────────────
const AIOrb: React.FC<{ state: "idle" | "thinking" | "responding" }> = ({ state }) => (
  <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
    {/* Static sparkle icon */}
    <Sparkles
      size={14}
      className={`
        text-plum-400 transition-all duration-500
        ${state === "thinking" ? "opacity-40 scale-75" : "opacity-100 scale-100"}
      `}
    />
    {/* Pulsing ring when thinking */}
    {state === "thinking" && (
      <span className="absolute inset-0 rounded-full border border-plum-400/60 animate-ping" />
    )}
  </span>
);

// ─── Animated waveform bars (mic active indicator) ───────────────────────────
const WaveformIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <span className="flex items-end gap-[2px] h-4 w-5">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className={`
          w-[3px] rounded-full bg-white/70 transition-all
          ${active ? "animate-waveform" : ""}
        `}
        style={{
          height: active ? undefined : `${[8, 12, 6, 10][i]}px`,
          animationDelay: `${i * 80}ms`,
        }}
      />
    ))}
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const FloatingAssistant: React.FC = () => {
  const { isOpen, isMinimized, closeAssistant, minimizeAssistant, openAssistant } =
    useAssistantStore();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false); // conversation card visible?
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pathname = window.location.pathname;
  const suggestions = getSuggestions(pathname);

  const { messages, isGenerating, send } = useAiChat(
    "Welcome to Tilet3D AI — your personal styling concierge."
  );

  const hasConversation = messages.length > 1;
  const aiState: "idle" | "thinking" | "responding" = isGenerating
    ? "thinking"
    : hasConversation
      ? "responding"
      : "idle";

  // Auto-expand once user sends first message
  useEffect(() => {
    if (hasConversation) setIsExpanded(true);
  }, [hasConversation]);

  // Auto-scroll
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }, [messages, isGenerating, isExpanded]);

  // Close => reset expanded too
  const handleClose = () => {
    closeAssistant();
    setIsExpanded(false);
  };

  // Minimise => collapse conversation card but keep pill
  const handleMinimise = () => {
    minimizeAssistant();
    setIsExpanded(false);
  };

  // Reopen from minimised
  const handleOpen = () => {
    openAssistant();
    if (hasConversation) setIsExpanded(true);
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    setIsExpanded(true);
    if (text.toLowerCase().includes("avatar studio")) navigate("/avatar");
    send(text);
  };

  const handleSuggestion = (s: string) => {
    setIsExpanded(true);
    send(s);
  };

  const handleInputFocus = () => {
    if (!isExpanded && hasConversation) setIsExpanded(true);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) handleMinimise();
  };

  // Not open → render nothing
  if (!isOpen) return null;

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────────
          MINIMISE BUTTON — top-right pill (only when conversation is expanded)
          Matches Gemini: "← Minimise" floating pill top-right
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && !isMinimized && (
          <motion.button
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={handleMinimise}
            className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-2.5 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-full text-white/90 text-[13px] font-medium shadow-lg"
            aria-label="Minimise assistant"
          >
            <ChevronDown size={14} className="opacity-70" />
            Minimise
          </motion.button>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────
          CONVERSATION CARD — floats above the pill, slides up from it
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && !isMinimized && (
          <>
            {/* Subtle dim — not a full black overlay, just a soft veil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMinimise}
              className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-[2px]"
            />

            {/* The conversation card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 20 }}
              dragElastic={0.08}
              onDragEnd={handleDragEnd}
              className="
                fixed left-3 right-3 z-[60]
                bottom-[88px]
                md:left-auto md:right-8 md:bottom-[80px] md:w-[420px]
                max-h-[60vh] md:max-h-[520px]
                bg-[#1c1c1e]/92 backdrop-blur-2xl
                border border-white/[0.08]
                rounded-[28px]
                shadow-[0_8px_40px_rgba(0,0,0,0.5)]
                flex flex-col
                overflow-hidden
                touch-none
              "
            >
              {/* Drag handle */}
              <div className="shrink-0 pt-2.5 pb-1 flex justify-center">
                <div className="w-9 h-1 bg-white/20 rounded-full cursor-grab active:cursor-grabbing" />
              </div>

              {/* Chat scroll area */}
              <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 space-y-4 touch-pan-y">

                {/* Initial suggestions — shown when no real conversation yet */}
                {!hasConversation && (
                  <div className="py-2">
                    <p className="text-white/40 text-[12px] font-medium mb-3 uppercase tracking-wider">
                      Try asking
                    </p>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          className="text-left px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/80 text-[14px] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {msg.role === "model" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AIOrb state={idx === messages.length - 1 && isGenerating ? "thinking" : "responding"} />
                        <span className="text-[11px] text-white/40 font-medium">Tilet3D AI</span>
                      </div>
                    )}
                    {(msg.content || msg.isStreaming) && (
                      <div
                        className={`
                          max-w-[88%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap
                          ${msg.role === "user"
                            ? "bg-white/[0.12] text-white rounded-tr-sm"
                            : "text-white/90 rounded-tl-sm"
                          }
                        `}
                      >
                        {msg.content || "···"}
                      </div>
                    )}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 w-full max-w-[96%]">
                        {msg.products.map((p) => (
                          <ProductPreviewCard key={p.id} product={p} compact />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking indicator */}
                {isGenerating && (
                  <div className="flex items-center gap-1.5">
                    <AIOrb state="thinking" />
                    <div className="flex gap-1 ml-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce"
                          style={{ animationDelay: `${i * 120}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} className="h-1" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────
          BOTTOM PILL — always visible when assistant is open (even minimised)
          This is the primary system-level AI invocation bar.
          Matches the "Ask Gemini" pill from the screenshots exactly.
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="
          fixed left-3 right-3 z-[65]
          bottom-[calc(env(safe-area-inset-bottom,0px)+72px)]
          md:left-auto md:right-8 md:bottom-8 md:w-[400px]
        "
      >
        <form
          onSubmit={handleSubmit}
          className="
            flex items-center gap-3
            bg-[#1c1c1e]/90 backdrop-blur-2xl
            border border-white/[0.10]
            rounded-[28px]
            px-5 py-4
            shadow-[0_4px_30px_rgba(0,0,0,0.6)]
          "
        >
          {/* AI orb icon — left anchor */}
          <AIOrb state={aiState} />

          {/* Input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={isMinimized && hasConversation ? "Continue conversation..." : "Ask Tilet3D..."}
            className="
              flex-1 bg-transparent text-[15px] text-white
              placeholder-white/40
              focus:outline-none
              min-w-0
            "
            aria-label="Ask Tilet3D AI"
          />

          {/* Mic icon */}
          <button
            type="button"
            className="shrink-0 text-white/50 hover:text-white transition-colors p-1"
            aria-label="Voice input"
          >
            <Mic size={18} />
          </button>

          {/* Waveform / send */}
          {input.trim() ? (
            <button
              type="submit"
              disabled={isGenerating}
              className="shrink-0 w-8 h-8 bg-plum-600 hover:bg-plum-500 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors"
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
            </button>
          ) : (
            <WaveformIcon active={isGenerating} />
          )}
        </form>
      </motion.div>
    </>
  );
};
