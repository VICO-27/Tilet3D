const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

// Restore the BrandLoader initial state
content = content.replace(
    "const [showBrandLoader, setShowBrandLoader] = useState(false); // Changed to false to avoid 50ms artificial delay",
    "const [showBrandLoader, setShowBrandLoader] = useState(true);"
);

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
