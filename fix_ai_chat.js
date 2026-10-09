const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', 'utf8');

// 1. Add global keyboard listener
const effectCode = `  const suggestions = getSuggestions(location.pathname);

  const { messages, isGenerating, send } = useAiChat(
    "Welcome to Tilet3D AI — your personal styling concierge."
  );

  // Auto-focus on typing
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier keys are pressed (e.g. Ctrl+C)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      // Ignore if already focused on an input/textarea
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      
      // Focus if printable char or backspace
      if (e.key.length === 1 || e.key === "Backspace") {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, isMinimized]);`;

content = content.replace(`  const suggestions = getSuggestions(location.pathname);

  const { messages, isGenerating, send } = useAiChat(
    "Welcome to Tilet3D AI — your personal styling concierge."
  );`, effectCode);


// 2. Add handleBackdropClick
const handleBackdropCode = `  const handleClose = () => {
    closeAssistant();
    setIsExpanded(false);
    setInput("");
  };

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.detail === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        handleMinimise();
      }, 250); // wait for potential double click
    } else if (e.detail === 2) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      handleClose();
    }
  };`;

content = content.replace(`  const handleClose = () => {
    closeAssistant();
    setIsExpanded(false);
    setInput("");
  };`, handleBackdropCode);


// 3. Update backdrop onClick
content = content.replace(
  `                onClick={handleMinimise}
                className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[1.5px]"`,
  `                onClick={handleBackdropClick}
                className="fixed inset-0 z-[55] bg-black/25 backdrop-blur-[1.5px]"
                style={{ cursor: 'pointer' }}`
);

fs.writeFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', content);
console.log("Patched FloatingAssistant.tsx successfully.");
