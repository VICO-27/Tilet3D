const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const localSkeletonRegex = /\/\/ ==========================================\n\/\/ LUXURY SKELETON LOADER COMPONENT\n\/\/ ==========================================\nconst ProductsSkeleton = \(\) => \([\s\S]*?<\/div>\n\);\n/m;

if (content.match(localSkeletonRegex)) {
    content = content.replace(localSkeletonRegex, '');
    fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
    console.log("Successfully removed local ProductsSkeleton.");
} else {
    console.log("Regex didn't match.");
}
