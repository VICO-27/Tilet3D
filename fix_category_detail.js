const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/products/pages/CategoryDetailPage.tsx', 'utf8');

// 1. Remove BrandLoader early return
content = content.replace("  if (isLoading) return <BrandLoader />;", "");

// 2. Import CategoryGridSkeleton
if (!content.includes('CategoryGridSkeleton')) {
    content = content.replace(
        "import BrandLoader from '@/shared/components/BrandLoader';",
        "import BrandLoader from '@/shared/components/BrandLoader';\nimport { CategoryGridSkeleton } from '../components/ProductsSkeleton';"
    );
}

// 3. Replace the products grid with skeleton if loading
const oldMain = /{filteredProducts\.length === 0 \? \(/;
const newMain = `{isLoading ? (
          <div className="mt-8">
            <CategoryGridSkeleton />
          </div>
        ) : filteredProducts.length === 0 ? (`;

content = content.replace(oldMain, newMain);

fs.writeFileSync('frontend/src/features/products/pages/CategoryDetailPage.tsx', content);
