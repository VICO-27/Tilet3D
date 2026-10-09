const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

// Fix implicitly any 'e'
content = content.replace(/const handleWheel = \(e\) => \{/g, 'const handleWheel = (e: WheelEvent) => {');
content = content.replace(/const handleTouchStart = \(e\) => \{/g, 'const handleTouchStart = (e: TouchEvent) => {');
content = content.replace(/const handleTouchMove = \(e\) => \{/g, 'const handleTouchMove = (e: TouchEvent) => {');

// Fix duplicate import ProductsSkeleton
// Check how many times it's imported
const importRegex = /import ProductsSkeleton from '\.\.\/components\/ProductsSkeleton';/g;
let matchCount = 0;
content = content.replace(importRegex, (match) => {
    matchCount++;
    if (matchCount > 1) return ''; // remove duplicates
    return match;
});

// Also check for conflicting local declarations
const localDeclRegex = /const ProductsSkeleton = /g;
if (content.match(localDeclRegex)) {
   console.log("Warning: local declaration exists!");
}

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
console.log("Fixed ProductsPage.tsx errors.");
