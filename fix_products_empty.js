const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const oldEmptyState = `<div className="py-24 text-center space-y-3">
                <p className="font-serif text-2xl text-stone-900">No matching pieces found</p>
                <p className="text-xs text-stone-400">Try searching for another name like "Kemis", "Netela", or adjusting your filters.</p>
              </div>`;

const newEmptyState = `<div className="py-24 text-center space-y-8 animate-fade-in">
                <div className="space-y-3">
                  <p className="font-serif text-2xl text-stone-900">We couldn't find an exact match</p>
                  <p className="text-xs text-stone-400">But we think you'll love these pieces from our collection.</p>
                </div>
                
                {/* Fallback to showing normal products instead of a dead end! */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 text-left">
                  {allProducts.slice(0, 6).map((product, index) => (
                    <ProductCard key={\`fallback-\${product.id}-\${index}\`} product={product} index={index} />
                  ))}
                </div>
              </div>`;

content = content.replace(oldEmptyState, newEmptyState);

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
