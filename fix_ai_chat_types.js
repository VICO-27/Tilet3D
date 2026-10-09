const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', 'utf8');
content = content.replace(/useRef<NodeJS\.Timeout \| null>/, 'useRef<number | null>');
// Also, setTimeout returns a number in browser environment
content = content.replace(/clickTimeoutRef\.current = setTimeout/, 'clickTimeoutRef.current = window.setTimeout');

fs.writeFileSync('frontend/src/features/ai/components/FloatingAssistant.tsx', content);
console.log("Fixed NodeJS.Timeout error.");
