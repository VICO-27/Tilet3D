const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', 'utf8');

const regex = /\/\/ Focus if printable char or backspace\s*if \(e\.key\.length === 1 \|\| e\.key === "Backspace"\) \{\s*inputRef\.current\?\.focus\(\);\s*\}/;

const replacement = `// Focus if printable char or backspace
      if (e.key.length === 1 || e.key === "Backspace") {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
          if (e.key.length === 1) {
            setInput(prev => prev + e.key);
            e.preventDefault();
          }
        }
      }`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', content);
  console.log("Updated typing logic.");
} else {
  console.log("Could not find regex match.");
}
