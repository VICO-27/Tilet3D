import React, { useRef, useEffect, useState, FormEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Mic, ArrowUp, ChevronDown, Sparkles, X, History, Square, ArrowDown, AlertCircle, RotateCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssistantStore } from "../store/useAssistantStore";
import { useAiChat } from "../hooks/useAiChat";
import { ProductPreviewCard } from "./ProductPreviewCard";

// ─── Context-aware suggestions ────────────────────────────────────────────────
const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/products/": ["Tell me about this outfit", "Find similar styles", "Check size guide", "Try this on in 3D"],
  "/products":  ["Find Habesha dresses under 3000 birr", "Show men's outfits", "Show new arrivals", "Under 2000 ETB"],
  "/avatar":    ["Help me choose an outfit", "Find styles for my body type", "Try traditional styles"],
  "/cart":      ["Review my cart", "Find cheaper alternatives", "Check similar products"],
  "/":          ["Find white Habesha dresses", "Show men's outfits", "Help me choose a style"],
};

const FOLLOWUP_QUICK_ACTIONS = [
  "Browse Kemis",
  "Wedding outfits",
  "Compare sizes",
  "How 3D try-on works",
  "Under 3,000 ETB",
];

function getSuggestions(pathname: string): string[] {
  const key = Object.keys(ROUTE_SUGGESTIONS).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  return ROUTE_SUGGESTIONS[key ?? "/"];
}

// ─── Pulsing AI sparkle orb ───────────────────────────────────────────────────
const AIOrb: React.FC<{ state: "idle" | "thinking" | "responding" | "retrieving" }> = ({ state }) => (
  <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
    <Sparkles
      size={14}
      className={`text-plum-400 transition-all duration-500 ${
        state === "thinking" || state === "retrieving" ? "opacity-40 scale-75 animate-spin" : "opacity-100 scale-100"
      }`}
    />
    {(state === "thinking" || state === "retrieving") && (
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

// ─── Thinking / Retrieving indicator ──────────────────────────────────────────
const ThinkingStateIndicator: React.FC<{ status?: string; detail?: string }> = ({ status, detail }) => {
  const isRetrieving = status === "retrieving";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs w-fit max-w-[90%]">
      <AIOrb state={isRetrieving ? "retrieving" : "thinking"} />
      <span className="truncate font-medium text-white/80">
        {detail || (isRetrieving ? "Finding the right pieces…" : "Consulting Tilet3D atelier…")}
      </span>
      <div className="flex gap-1 ml-1 shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-plum-400/70 animate-bounce"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export const FloatingAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, isMinimized, closeAssistant, minimizeAssistant } =
    useAssistantStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const suggestions = getSuggestions(location.pathname);

  const { messages, isGenerating, activeStatus, statusDetail, send, stop, retry } = useAiChat(
    t("ai.welcome", "Welcome to Tilet3D AI, your personal styling concierge.")
  );

  // Auto-focus on typing
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      
      if (e.key.length === 1 || e.key === "Backspace") {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
          if (e.key.length === 1) {
            setInput(prev => prev + e.key);
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, isMinimized]);

  const hasConversation = messages.length > 1;
  const aiState: "idle" | "thinking" | "responding" | "retrieving" = isGenerating
    ? activeStatus === "retrieving"
      ? "retrieving"
      : "thinking"
    : hasConversation
      ? "responding"
      : "idle";

  // Smart non-disruptive auto-scroll
  const scrollToBottom = useCallback((smooth = true) => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      setIsUserScrolledUp(false);
    }
  }, []);

  useEffect(() => {
    if (isExpanded && !isUserScrolledUp) {
      const id = setTimeout(() => scrollToBottom(true), 60);
      return () => clearTimeout(id);
    }
  }, [messages, isGenerating, isExpanded, isUserScrolledUp, scrollToBottom]);

  // Track scroll position to prevent forcing users away from past messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsUserScrolledUp(distanceToBottom > 75);
  };

  const handleClose = useCallback(() => {
    closeAssistant();
    setIsExpanded(false);
  }, [closeAssistant]);

  const clickTimeoutRef = useRef<number | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.detail === 1) {
      clickTimeoutRef.current = window.setTimeout(() => {
        handleMinimise();
      }, 250);
    } else if (e.detail === 2) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      handleClose();
    }
  };

  const handleMinimise = () => {
    minimizeAssistant();
    setIsExpanded(false);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isGenerating) return;

    // Only clear input after submission is accepted
    setInput("");
    setIsExpanded(true);
    setIsUserScrolledUp(false);

    if (text.toLowerCase().includes("avatar studio")) {
      navigate("/avatar");
    }

    await send(text);
  };

  const handleSuggestionClick = (s: string) => {
    setIsExpanded(true);
    setIsUserScrolledUp(false);
    send(s);
  };

  const handleInputFocus = () => {
    if (!isExpanded && hasConversation) setIsExpanded(true);
  };

  const handleCardDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) handleMinimise();
  };

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
                onClick={handleBackdropClick}
                className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[1.5px]"
                style={{ cursor: "pointer" }}
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
                className="
                  fixed left-3 right-3 z-[60]
                  md:left-auto md:right-8 md:w-[420px]
                  bottom-[90px] md:bottom-[108px]
                  max-h-[60vh] md:max-h-[520px]
                  bg-neutral-950/95 backdrop-blur-2xl
                  border border-white/[0.08]
                  rounded-[24px]
                  shadow-[0_-4px_40px_rgba(0,0,0,0.65)]
                  flex flex-col
                  overflow-hidden
                  cursor-grab active:cursor-grabbing
                "
              >
                {/* Header / Drag handle */}
                <div className="shrink-0 pt-3 pb-1.5 px-5 flex items-center justify-between border-b border-white/[0.04]">
                  <button 
                    type="button"
                    onClick={handleMinimise}
                    className="w-16 flex items-center justify-start gap-1 text-white/40 hover:text-white/80 transition-colors text-[11px] font-semibold tracking-wide uppercase"
                    aria-label={t("ai.minimise", "Minimise")}
                  >
                    <ChevronDown size={14} />
                    <span>{t("ai.minimise", "Minimise")}</span>
                  </button>

                  <div className="w-8 h-[3px] bg-white/15 rounded-full" />
                  
                  <button 
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigate('/account');
                    }}
                    className="w-16 flex items-center justify-end gap-1.5 text-white/40 hover:text-white/80 transition-colors text-[11px] font-semibold tracking-wide uppercase"
                    aria-label={t("ai.log", "Log")}
                  >
                    <History size={12} />
                    <span>{t("ai.log", "Log")}</span>
                  </button>
                </div>

                {/* Chat scroll area */}
                <div
                  ref={scrollAreaRef}
                  onScroll={handleScroll}
                  className="relative flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 space-y-4 touch-pan-y cursor-default scroll-smooth"
                >
                  {/* Suggestions — only before conversation starts */}
                  {!hasConversation && (
                    <div className="py-2">
                      <p className="text-white/35 text-[11px] font-semibold mb-3 uppercase tracking-[0.12em]">
                        {t("ai.tryAsking", "Try asking")}
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
                      key={msg.id || idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {/* AI label row */}
                      {msg.role === "model" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <AIOrb
                            state={
                              idx === messages.length - 1 && isGenerating
                                ? activeStatus === "retrieving"
                                  ? "retrieving"
                                  : "thinking"
                                : "responding"
                            }
                          />
                          <span className="text-[11px] text-white/35 font-semibold tracking-wide">
                            TILET3D CONCIERGE
                          </span>
                        </div>
                      )}

                      {/* Content Bubble or Status */}
                      {msg.role === "model" && msg.status === "error" ? (
                        <div className="max-w-[90%] p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{msg.content}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => retry()}
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800/80 active:bg-red-950 text-white text-[11px] font-semibold transition-colors shadow-sm"
                          >
                            <RotateCcw size={12} />
                            <span>Retry</span>
                          </button>
                        </div>
                      ) : (msg.content || msg.isStreaming) ? (
                        <div
                          className={`max-w-[88%] px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-white/[0.12] text-white rounded-tr-[6px]"
                              : "text-white/90 bg-white/[0.04] border border-white/[0.06] rounded-tl-[6px]"
                          }`}
                        >
                          {msg.content}
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-3.5 ml-1 bg-plum-400 animate-pulse align-middle" />
                          )}
                        </div>
                      ) : (
                        idx === messages.length - 1 && isGenerating && (
                          <ThinkingStateIndicator status={msg.status} detail={msg.statusDetail || statusDetail} />
                        )
                      )}

                      {/* Product cards */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2.5 w-full max-w-[98%]">
                          {msg.products.map((p) => (
                            <ProductPreviewCard key={p.id} product={p} compact />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Active retrieval indicator if bottom message is empty */}
                  {isGenerating && messages[messages.length - 1]?.content === "" && (
                    <ThinkingStateIndicator status={activeStatus} detail={statusDetail} />
                  )}

                  {/* Contextual quick action chips after responses */}
                  {hasConversation && !isGenerating && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {FOLLOWUP_QUICK_ACTIONS.slice(0, 3).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => handleSuggestionClick(action)}
                          className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-white/70 hover:text-white text-[11px] transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  <div ref={endRef} className="h-px" />
                </div>

                {/* Subtle Floating "Scroll to latest" control */}
                <AnimatePresence>
                  {isUserScrolledUp && (
                    <motion.button
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      type="button"
                      onClick={() => scrollToBottom(true)}
                      className="absolute bottom-4 right-5 px-3 py-1.5 rounded-full bg-neutral-900/95 border border-white/20 text-white/90 hover:text-white text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-1.5 z-20 transition-all hover:scale-105 active:scale-95"
                    >
                      <ArrowDown size={13} />
                      <span>Scroll to latest</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════════════════════
              BOTTOM PILL — always visible while assistant is open
          ═══════════════════════════════════════════════════════════════════ */}
          <motion.div
            key="bottom-pill"
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="
              fixed left-4 right-4 z-[65]
              bottom-4
              md:left-auto md:right-8 md:bottom-8 md:w-[420px]
            "
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <form
              onSubmit={handleSubmit}
              className="
                flex items-center gap-3
                bg-neutral-950/95 backdrop-blur-2xl
                border border-white/[0.10]
                rounded-[28px] px-4 py-3.5
                shadow-[0_4px_32px_rgba(0,0,0,0.65)]
                min-h-[56px]
              "
            >
              {/* ✕ Close button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label={t("ai.closeAssistant", "Close AI assistant")}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  isMinimized && hasConversation
                    ? t("ai.continueConversation", "Continue conversation...")
                    : t("ai.askTilet", "Ask Tilet3D Concierge...")
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

              {/* Mic / Voice */}
              <button
                type="button"
                className="shrink-0 p-1.5 text-white/45 hover:text-white/70 transition-colors"
                aria-label={t("ai.voiceInput", "Voice input")}
              >
                <Mic size={18} />
              </button>

              {/* Action Button: Stop button during streaming, Send button when typing, Waveform otherwise */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label={t("ai.stopGenerating", "Stop response")}
                  className="shrink-0 w-8 h-8 bg-neutral-800 hover:bg-red-900/70 border border-white/20 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="Stop generating"
                >
                  <Square size={12} className="fill-current text-white" />
                </button>
              ) : input.trim() ? (
                <button
                  type="submit"
                  aria-label={t("ai.sendMessage", "Send message")}
                  className="shrink-0 w-8 h-8 bg-plum-600 hover:bg-plum-500 active:bg-plum-700 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  <ArrowUp size={15} strokeWidth={2.5} className="text-white" />
                </button>
              ) : (
                <WaveformBars active={false} />
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

