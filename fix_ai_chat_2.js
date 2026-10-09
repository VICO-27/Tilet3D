const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', 'utf8');

const replacement = `  const handleClose = () => {
    closeAssistant();
    setIsExpanded(false);
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

content = content.replace(/  const handleClose = \(\) => \{\s*closeAssistant\(\);\s*setIsExpanded\(false\);\s*\};/, replacement);

fs.writeFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', content);
console.log("Fixed handleBackdropClick injection.");
