const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const oldButtonBlock = /\{viewContext === 'normal' && visibleCount < activeCategories\.length && \([\s\S]*?<div className="w-full flex flex-col items-center justify-center mt-20 px-6">[\s\S]*?<button\n\s*onClick=\{\(\) => setVisibleCount\(prev => prev \+ 2\)\}[\s\S]*?<span className="text-sm font-black tracking-widest uppercase">Next Clothes<\/span>[\s\S]*?<p className="text-\[11px\] tracking-\[0\.3em\] uppercase font-bold text-zinc-500">\n\s*Next: \{activeCategories\.slice\(visibleCount, visibleCount \+ 2\)\.join\(" & "\)\}\n\s*<\/p>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/m;

const newButtonBlock = `{viewContext === 'normal' && (
              <div className="w-full flex flex-col items-center justify-center mt-20 px-6">
                <div className="w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent mb-16" />

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => {
                      if (visibleCount >= activeCategories.length) {
                        // Loop back to the start
                        setVisibleCount(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setVisibleCount(prev => prev + 2);
                      }
                    }}
                    className="inline-flex items-center gap-4 px-10 py-5 bg-black text-white rounded-full shadow-xl hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <span className="text-sm font-black tracking-widest uppercase">Next Clothes</span>
                    <div className="bg-white/20 p-2 rounded-full">
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-zinc-500">
                    Next: {(visibleCount >= activeCategories.length 
                      ? activeCategories.slice(0, 2) 
                      : activeCategories.slice(visibleCount, visibleCount + 2)).join(" & ")}
                  </p>
                </div>
              </div>
            )}`;

if (content.match(oldButtonBlock)) {
    content = content.replace(oldButtonBlock, newButtonBlock);
    fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
    console.log("Successfully replaced Next Clothes loop block.");
} else {
    console.log("Regex did not match.");
}
