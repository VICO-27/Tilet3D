import React, { useRef, useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Mic, ArrowUp, ChevronDown, Sparkles, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssistantStore } from "../store/useAssistantStore";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "./ProductPreviewCard";

// ─── Context-aware suggestions ────────────────────────────────────────────────
const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/products/": ["Tell me about this outfit", "Find similar styles", "Check size guide", "Try this on"],
  "/products":  ["Find Habesha dresses under 3000 birr", "Show men's outfits", "Show new arrivals", "Under 2000 ETB"],
  "/avatar":    ["Help me choose an outfit", "Find styles for my body type", "Try traditional styles"],
  "/cart":      ["Review my cart", "Find cheaper alternatives", "Check similar products"],
  "/":          ["Find white Habesha dresses", "Show men's outfits", "Help me choose a style"],
};

function getSuggestions(pathname: string): string[] {
  const key = Object.keys(ROUTE_SUGGESTIONS).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  return ROUTE_SUGGESTIONS[key ?? "/"];
}

// ─── Pulsing AI sparkle orb ───────────────────────────────────────────────────
const AIOrb: React.FC<{ state: "idle" | "thinking" | "responding" }> = ({ state }) => (
  <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
    <Sparkles
      size={14}
      className={`text-plum-400 transition-all duration-500 ${
        state === "thinking" ? "opacity-30 scale-75" : "opacity-100 scale-100"
      }`}
    />
    {state === "thinking" && (
      <span className="absolute inset-[-3px] rounded-full border border-plum-400/50 animate-ping" />
    )}
  </span>
);

// ─── Waveform bars ────────────────────────────────────────────────────────────
const WaveformBars: React.FC<{ active?: boolean }> = ({ active }) => (
  <span className="flex items-end gap-[2.5px] h-[18px] w-[22px] shrink-0">
    {[8, 13, 6, 11].map((h, i) => (
      <span
        key={i}
        className={`w-[3px] rounded-full transition-all ${
          active ? "animate-waveform bg-plum-400" : "bg-white/40"
        }`}
        style={{
          height: active ? undefined : `${h}px`,
          animationDelay: `${i * 80}ms`,
        }}
      />
    ))}
  </span>
);

// ─── Thinking dots ────────────────────────────────────────────────────────────
const ThinkingDots: React.FC = () => (
  <div className="flex items-center gap-1.5 px-1 py-2">
    <AIOrb state="thinking" />
    <div className="flex gap-1 ml-0.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
          style={{ animationDelay: `${i * 130}ms` }}
        />
      ))}
    </div>
  </div>
);

// ─── Production-ready conversation card ──────────────────────────────────────
// Layout zones:
//  • Minimise button  → fixed, top-[56px] right-3  (below 48px navbar)
//  • Conversation card → fixed, bottom just above pill
//  • Bottom pill       → fixed, bottom-[calc(4px + MobileDock = 0 on mobile since dock is side, safe-area)]
//
// z-layers:
//  backdrop 55 | card 60 | pill 65 | minimise 70 | MobileDock 100 (no conflict, dock is side)
// ─────────────────────────────────────────────────────────────────────────────

// Pill height ~64px + 20px gap = 84px offset for the card bottom
const PILL_H = 84; // px — pill outer height + comfortable gap

export const FloatingAssistant: React.FC = () => {
  const { isOpen, isMinimized, closeAssistant, minimizeAssistant, openAssistant } =
    useAssistantStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const suggestions = getSuggestions(location.pathname);

  const { messages, isGenerating, send } = useAiChat(
    "Welcome to Tilet3D AI — your personal styling concierge."
  );

  const hasConversation = messages.length > 1;
  const aiState: "idle" | "thinking" | "responding" = isGenerating
    ? "thinking"
    : hasConversation
      ? "responding"
      : "idle";

  // Expand conversation panel automatically once user has messages
  useEffect(() => {
    if (hasConversation && isOpen && !isMinimized) setIsExpanded(true);
  }, [hasConversation, isOpen, isMinimized]);

  // Reset expanded state when minimised or closed
  useEffect(() => {
    if (!isOpen || isMinimized) setIsExpanded(false);
  }, [isOpen, isMinimized]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded) {
      const id = setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      return () => clearTimeout(id);
    }
  }, [messages, isGenerating, isExpanded]);

  const handleClose = () => {
    closeAssistant();
    setIsExpanded(false);
  };

  const handleMinimise = () => {
    minimizeAssistant();
    setIsExpanded(false);
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput("");
    setIsExpanded(true);
    if (text.toLowerCase().includes("avatar studio")) navigate("/avatar");
    send(text);
  };

  const handleSuggestionClick = (s: string) => {
    setIsExpanded(true);
    send(s);
  };

  const handleInputFocus = () => {
    // If conversation exists but card is collapsed, expand on focus
    if (!isExpanded && hasConversation) setIsExpanded(true);
  };

  const handleCardDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) handleMinimise();
  };

  // ─── Escape key to close ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              MINIMISE PILL — top-right, below the 48px Navbar
          ═══════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                key="minimise-btn"
                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                onClick={handleMinimise}
                aria-label="Minimise assistant"
                className="fixed top-[56px] right-3 z-[70] flex items-center gap-1.5 px-4 py-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-full text-white/80 text-[13px] font-medium shadow-lg select-none"
              >
                <ChevronDown size={13} className="opacity-60" />
                Minimise
              </motion.button>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════════════════════
              BACKDROP — soft dim, tapping it collapses the card
          ═══════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleMinimise}
                className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[1.5px]"
                aria-hidden="true"
              />
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════════════════════
              CONVERSATION CARD — rises from above the pill
          ═══════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                key="conversation-card"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.3 }}
                onDragEnd={handleCardDragEnd}
                style={{ bottom: `${PILL_H}px` }}
                className="
                  fixed left-3 right-3 z-[60]
                  md:left-auto md:right-8 md:w-[400px]
                  max-h-[58vh] md:max-h-[500px]
                  bg-[#1c1c1e]/94 backdrop-blur-2xl
                  border border-white/[0.07]
                  rounded-[24px]
                  shadow-[0_-4px_40px_rgba(0,0,0,0.55)]
                  flex flex-col
                  overflow-hidden
                  cursor-grab active:cursor-grabbing
                "
              >
                {/* Drag handle */}
                <div className="shrink-0 pt-2.5 pb-1.5 flex justify-center">
                  <div className="w-8 h-[3px] bg-white/15 rounded-full" />
                </div>

                {/* Chat scroll area — touch-pan-y so scrolling isn't hijacked */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-4 space-y-4 touch-pan-y cursor-default">
                  {/* Suggestions — only before conversation starts */}
                  {!hasConversation && (
                    <div className="py-2">
                      <p className="text-white/35 text-[11px] font-semibold mb-3 uppercase tracking-[0.12em]">
                        Try asking
                      </p>
                      <div className="flex flex-col gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="text-left px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.14] border border-white/[0.07] text-white/75 text-[14px] leading-snug transition-colors"
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
                      {/* AI label row */}
                      {msg.role === "model" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <AIOrb
                            state={
                              idx === messages.length - 1 && isGenerating
                                ? "thinking"
                                : "responding"
                            }
                          />
                          <span className="text-[11px] text-white/35 font-semibold tracking-wide">
                            TILET3D AI
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      {(msg.content || msg.isStreaming) && (
                        <div
                          className={`max-w-[88%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-white/[0.12] text-white rounded-tr-[6px]"
                              : "text-white/88 rounded-tl-[6px]"
                          }`}
                        >
                          {msg.content || "···"}
                        </div>
                      )}

                      {/* Product cards — styled for dark background */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 w-full max-w-[98%]">
                          {msg.products.map((p) => (
                            <div key={p.id} className="rounded-xl overflow-hidden bg-white/[0.07] border border-white/[0.08]">
                              <ProductPreviewCard product={p} compact />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {isGenerating && <ThinkingDots />}

                  <div ref={endRef} className="h-px" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════════════════════
              BOTTOM PILL — always visible while assistant is open
              Sits above the mobile safe area. No bottom-nav conflict since
              MobileDock is a side handle (right-side), not a bottom bar.
          ═══════════════════════════════════════════════════════════════════ */}
          <motion.div
            key="bottom-pill"
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            // Safe area: 16px from bottom on mobile (side dock so no conflict), 32px on md+
            className="
              fixed left-4 right-4 z-[65]
              bottom-4
              md:left-auto md:right-8 md:bottom-8 md:w-[400px]
            "
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <form
              onSubmit={handleSubmit}
              className="
                flex items-center gap-3
                bg-[#1c1c1e]/92 backdrop-blur-2xl
                border border-white/[0.10]
                rounded-[28px] px-4 py-3.5
                shadow-[0_4px_32px_rgba(0,0,0,0.65)]
                min-h-[56px]
              "
            >
              {/* ✕ Close button — always reachable */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close AI assistant"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>

              {/* AI orb */}
              <AIOrb state={aiState} />

              {/* Input */}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={handleInputFocus}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={
                  isMinimized && hasConversation
                    ? "Continue conversation..."
                    : "Ask Tilet3D..."
                }
                className="
                  flex-1 bg-transparent text-[15px] text-white
                  placeholder:text-white/38
                  focus:outline-none
                  min-w-0 py-1
                "
                aria-label="Ask Tilet3D AI"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {/* Mic */}
              <button
                type="button"
                className="shrink-0 p-1 text-white/45 hover:text-white/70 transition-colors"
                aria-label="Voice input"
              >
                <Mic size={18} />
              </button>

              {/* Send button when typing, waveform otherwise */}
              {input.trim() ? (
                <button
                  type="submit"
                  disabled={isGenerating}
                  aria-label="Send message"
                  className="shrink-0 w-8 h-8 bg-plum-600 hover:bg-plum-500 active:bg-plum-700 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <ArrowUp size={15} strokeWidth={2.5} className="text-white" />
                </button>
              ) : (
                <WaveformBars active={isGenerating} />
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
