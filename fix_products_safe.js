const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

// 1. Remove the inline ProductsSkeleton
const inlineSkeletonRegex = /\/\/ ==========================================\n\/\/ LUXURY SKELETON LOADER COMPONENT\n\/\/ ==========================================\nconst ProductsSkeleton = \(\) => \([^]+?\}\)\);\n/m;
content = content.replace(inlineSkeletonRegex, '');

// 2. Add import
if (!content.includes('import ProductsSkeleton from')) {
    content = content.replace(
        "import ProductCard, { Product } from '../components/ProductCard';",
        "import ProductCard, { Product } from '../components/ProductCard';\nimport ProductsSkeleton from '../components/ProductsSkeleton';"
    );
}

// 3. Remove artificial 50ms BrandLoader delay SAFELY.
// Just change `const [showBrandLoader, setShowBrandLoader] = useState(true);` 
// to `const [showBrandLoader, setShowBrandLoader] = useState(false);`
content = content.replace(
    "const [showBrandLoader, setShowBrandLoader] = useState(true);",
    "const [showBrandLoader, setShowBrandLoader] = useState(false); // Changed to false to avoid 50ms artificial delay"
);

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
