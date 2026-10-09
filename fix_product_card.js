const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/components/ProductCard.tsx', 'utf8');

const oldMediaBlockRegex = /<div className="absolute inset-0 w-full h-full">\s*\{activeMedia\?\.media_type === 'video' \? \(\s*<video src=\{activeMedia\.file\} autoPlay muted loop className="w-full h-full object-cover" \/>\s*\) : \(\s*<img\s*src=\{optimizeCloudinaryUrl\(activeMedia\?\.file, 'c_fill,w_600,q_auto,f_auto'\)\}\s*alt=\{product\.name\}\s*loading=\{index < 5 \? 'eager' : 'lazy'\}\s*fetchPriority=\{index < 5 \? 'high' : 'auto'\}\s*className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"\s*\/>\s*\)\}\s*<\/div>/m;

const newMediaBlock = `<div className="absolute inset-0 w-full h-full bg-stone-100">
          {/* Primary Media */}
          {primary?.media_type === 'video' ? (
            <video 
              src={primary.file} 
              autoPlay 
              muted 
              loop 
              playsInline
              className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out \${!isHovered || !hoverMedia ? 'opacity-100' : 'opacity-0'}\`} 
            />
          ) : (
            <img
              src={optimizeCloudinaryUrl(primary?.file, 'c_fill,w_600,q_auto,f_auto')}
              alt={product.name}
              loading={index < 5 ? 'eager' : 'lazy'}
              fetchPriority={index < 5 ? 'high' : 'auto'}
              className={\`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out \${!isHovered || !hoverMedia ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'}\`}
            />
          )}

          {/* Hover Media (Preloaded and Ready) */}
          {hoverMedia && (
            hoverMedia.media_type === 'video' ? (
              <video 
                src={hoverMedia.file} 
                muted 
                loop 
                playsInline
                preload="auto"
                ref={(el) => {
                  if (el) {
                    if (isHovered) {
                      el.play().catch(()=>{});
                    } else {
                      el.pause();
                      el.currentTime = 0;
                    }
                  }
                }}
                className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out \${isHovered ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`} 
              />
            ) : (
              <img
                src={optimizeCloudinaryUrl(hoverMedia.file, 'c_fill,w_600,q_auto,f_auto')}
                alt={\`\${product.name} hover\`}
                loading="lazy"
                className={\`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out \${isHovered ? 'opacity-100 scale-105 z-10' : 'opacity-0 scale-100 z-0'}\`}
              />
            )
          )}
        </div>`;

if (content.match(oldMediaBlockRegex)) {
    content = content.replace(oldMediaBlockRegex, newMediaBlock);
    fs.writeFileSync('frontend/src/features/products/components/ProductCard.tsx', content);
    console.log("Successfully replaced media rendering block.");
} else {
    console.log("Could not find the old media block regex. Check syntax.");
}
