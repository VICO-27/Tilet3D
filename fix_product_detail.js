const fs = require('fs');
let content = fs.readFileSync('frontend/src/features/products/pages/ProductDetailPage.tsx', 'utf8');

// Add import
if (!content.includes('ProductDetailSkeleton')) {
    content = content.replace(
        "import BrandLoader from '@/shared/components/BrandLoader';",
        "import BrandLoader from '@/shared/components/BrandLoader';\nimport ProductDetailSkeleton from '../components/ProductDetailSkeleton';"
    );
}

// Replace loading state
const oldLoading = `  if (loading) {\n    return (\n      <PageLayout>\n        <BrandLoader />\n      </PageLayout>\n    );\n  }`;
const newLoading = `  if (loading) {\n    return (\n      <PageLayout>\n        <ProductDetailSkeleton />\n      </PageLayout>\n    );\n  }`;

content = content.replace(oldLoading, newLoading);

fs.writeFileSync('frontend/src/features/products/pages/ProductDetailPage.tsx', content);
