const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const regex = /const \[showBrandLoader, setShowBrandLoader\] = useState\(true\);\n*/m;
content = content.replace(regex, `const [showBrandLoader, setShowBrandLoader] = useState(true);

  // Keep BrandLoader visible until the products have fully loaded in the background!
  useEffect(() => {
    if (!isLoading) {
      // The moment the products are fetched and ready, we drop the BrandLoader
      // Added a slight 400ms delay so the beautiful brand animation isn't abruptly cut off if network is instantly fast
      const timer = setTimeout(() => {
        setShowBrandLoader(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);\n\n`);

// Ensure any old 50ms useEffect is removed so we don't have conflicting timers
const oldTimerRegex = /\/\/ 1\. Brand Loader takes over for the first 50ms to build suspense\n\s*useEffect\(\(\) => \{\n\s*const timer = setTimeout\(\(\) => \{\n\s*setShowBrandLoader\(false\);\n\s*\}, 50\);\n\s*return \(\) => clearTimeout\(timer\);\n\s*\}, \[\]\);\n/m;
content = content.replace(oldTimerRegex, '');

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
