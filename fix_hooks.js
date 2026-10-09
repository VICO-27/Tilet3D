const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const hookBlockRegex = /\s*\/\/ ==========================================\n\s*\/\/ OVERSCROLL "PULL TO LOAD" INFINITE SCROLL\n\s*\/\/ ==========================================\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[viewContext, searchQuery, visibleCount, activeCategories\.length\]\);\n/m;

const match = content.match(hookBlockRegex);
if (match) {
    const hookCode = match[0];
    
    // Remove it from its current position
    content = content.replace(hookBlockRegex, '\n');
    
    // Insert it before `if (showBrandLoader)`
    content = content.replace(
        '  // Render BrandLoader first',
        hookCode + '\n  // Render BrandLoader first'
    );
    
    fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
    console.log("Successfully moved the hook before early returns.");
} else {
    console.log("Could not find the hook block.");
}
