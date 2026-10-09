const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/components/ProductCard.tsx', 'utf8');

const regex = /<div className="absolute inset-0 w-full h-full bg-stone-100">[\s\S]*?\{hoverMedia && \(/m;

const newBlock = `<div className="absolute inset-0 w-full h-full bg-stone-100">
          {/* Primary Media - Always visible (z-0) so it never flashes white if the hover media is slow! */}
          {primary?.media_type === 'video' ? (
            <video 
              src={primary.file} 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-100 z-0" 
            />
          ) : (
            <img
              src={optimizeCloudinaryUrl(primary?.file, 'c_fill,w_600,q_auto,f_auto')}
              alt={product.name}
              loading={index < 5 ? 'eager' : 'lazy'}
              fetchPriority={index < 5 ? 'high' : 'auto'}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out opacity-100 scale-100 group-hover:scale-105 z-0"
            />
          )}

          {/* Hover Media (Preloaded and Ready) */}
          {hoverMedia && (`;

content = content.replace(regex, newBlock);

fs.writeFileSync('frontend/src/features/products/components/ProductCard.tsx', content);
console.log("Fixed white flash issue.");
