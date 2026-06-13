import { useState } from "react";

const categories = [
  "Habesha Kemis",
  "Suri",
  "Shemiz",
  "T-Shirt",
  "Scarf",
  "Shurab",
  "Sharb",
  "Shash",
  "Netela",
  "Gabi",
];

const ProductNavbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const jumpToSection = (id: string) => {
    const sectionTarget = document.getElementById(id);
    if (sectionTarget) {
      // Adjusted calculation:
      // Global Navbar (48px) + Product Sub-Navbar (56px) = 104px total offset
      const combinedNavbarOffset = 104;
      
      window.scrollTo({
        top: sectionTarget.getBoundingClientRect().top + window.pageYOffset - combinedNavbarOffset,
        behavior: "smooth",
      });
    }
  };

  return (
    /* FIXED: Changed `top-0` to `top-[48px]` to stick perfectly flush right 
      underneath your main shared top navigation layer.
    */
    <div className="sticky top-[48px] z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 antialiased">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center h-14 justify-between relative">
          
          {/* Left Block - Brand Anchor */}
          <div className="flex-shrink-0 z-10">
            <a href="/" className="text-sm font-black text-black tracking-widest uppercase select-none">
              ጥለት<span className="text-purple-600">3D</span>
            </a>
          </div>

          {/* Centered Category Links */}
          <div className="absolute inset-x-0 flex justify-center items-center overflow-x-auto scrollbar-hide px-24">
            <div className="flex items-center space-x-8 whitespace-nowrap">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => jumpToSection(category.toLowerCase().replace(/\s+/g, "-"))}
                  className="text-[11px] font-bold text-neutral-500 hover:text-black border-b border-transparent hover:border-black pb-0.5 transition-all uppercase tracking-wider"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Right Block - Search Trigger */}
          <div className="flex-shrink-0 z-10">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 text-neutral-500 hover:text-purple-600 transition-colors focus:outline-none"
              aria-label="Toggle Input Field"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Slide-Down Search Area */}
      {isSearchOpen && (
        <div className="absolute top-14 left-0 w-full bg-white border-b border-neutral-200 shadow-sm animate-fade-in-down">
          <div className="max-w-xl mx-auto px-8 py-3.5 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search custom collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none"
              autoFocus
            />
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
              className="text-[10px] text-neutral-400 hover:text-black font-extrabold uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductNavbar;