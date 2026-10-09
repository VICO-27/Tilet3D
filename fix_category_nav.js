const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/CategoryDetailPage.tsx', 'utf8');

// Add import for useScrollDirection if not present
if (!content.includes('useScrollDirection')) {
    content = content.replace(
        "import BrandLoader from '@/shared/components/BrandLoader';",
        "import BrandLoader from '@/shared/components/BrandLoader';\nimport { useScrollDirection } from '@/shared/hooks/useScrollDirection';"
    );
}

// Add the hook call inside the component
if (!content.includes('const { navbarHidden }')) {
    content = content.replace(
        "const [visibleCount, setVisibleCount] = useState(12);",
        "const [visibleCount, setVisibleCount] = useState(12);\n  const { navbarHidden } = useScrollDirection();"
    );
}

// Modify the nav className
const oldNav = /<nav className="fixed inset-x-0 top-0 z-50 bg-white\/70 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between">/;
const newNav = `<nav className={\`fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] \${navbarHidden ? '-translate-y-full' : 'translate-y-0'}\`}>`;

content = content.replace(oldNav, newNav);

fs.writeFileSync('frontend/src/features/products/pages/CategoryDetailPage.tsx', content);
