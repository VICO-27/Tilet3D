// src/components/products/ProductFooter.tsx
const ProductFooter = () => {
  return (
    <footer className="bg-neutral-50 text-neutral-600 text-xs font-medium border-t border-neutral-200 pt-16 pb-8 tracking-normal">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* Footnote Brand Intro Disclaimer */}
        <p className="text-neutral-400 pb-8 border-b border-neutral-200 leading-relaxed font-normal">
          * ጥለት3D virtual measurement configuration results may vary depending on local camera lighting alignment and structural precision tools. 3D PBR render tracking services require compatible WebGL2 canvas configurations. Custom ordered cultural garments are handcrafted via standard sustainable artisan guilds in Addis Ababa, Ethiopia.
        </p>

        {/* Dynamic Directory Grids */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          
          {/* Column 1: Explore Assets */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-800 tracking-tight">Explore Tilet3D</h4>
            <ul className="space-y-2.5">
              <li><a href="#habesha-kemis" className="hover:underline text-neutral-500">Habesha Kemis</a></li>
              <li><a href="#suri" className="hover:underline text-neutral-500">Suri Pants & Vest Sets</a></li>
              <li><a href="#shemiz" className="hover:underline text-neutral-500">Premium Men's Shemiz</a></li>
              <li><a href="#t-shirt" className="hover:underline text-neutral-500">Modern Cultural T-Shirts</a></li>
              <li><a href="#scarf" className="hover:underline text-neutral-500">Artisan Silk Scarves</a></li>
              <li><a href="#netela" className="hover:underline text-neutral-500">Traditional Netela</a></li>
              <li><a href="#gabi" className="hover:underline text-neutral-500">Heavy Knit Luxury Gabi</a></li>
            </ul>
          </div>

          {/* Column 2: 3D Engine Architecture */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-800 tracking-tight">Interactive Studio</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:underline text-neutral-500">Avatar Generation Portal</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">360° Fabric Inspector</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">PBR Thread Modeling</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Gemini Fit Verification</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Real-time Ray Tracer</a></li>
            </ul>
          </div>

          {/* Column 3: Account & Cart Management */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-800 tracking-tight">Your Account</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:underline text-neutral-500">Manage Your 3D Profile</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Tilet3D Design Wallet</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Artisan Custom Measures</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Order Dispatch History</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Diaspora Shipping Portal</a></li>
            </ul>
          </div>

          {/* Column 4: Business Solutions */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-800 tracking-tight">For Business & Tailors</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:underline text-neutral-500">Tilet3D for Bridal Houses</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Artisan Weaver Network</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">B2B Custom Corporate Order</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Wholesale Heritage Logistics</a></li>
            </ul>
          </div>

          {/* Column 5: Brand Foundations */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-800 tracking-tight">ጥለት3D Values</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="hover:underline text-neutral-500">Artisan Wage Transparency</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Organic Cotton Farming</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Cultural Pattern Protection</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Data Privacy & Scan Security</a></li>
              <li><a href="#" className="hover:underline text-neutral-500">Press Newsroom Matrix</a></li>
            </ul>
          </div>

        </div>

        {/* Corporate Legal Footer Axis */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-neutral-400 font-normal">
          <div className="space-y-1">
            <p>More ways to shop: Find a registered weaving house retailer near you. Or call 09-MY-TILET-3D.</p>
            <p>Copyright © 2026 ጥለት3D Inc. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-500 font-medium">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="text-neutral-200">|</span>
            <a href="#" className="hover:underline">Terms of Use</a>
            <span className="text-neutral-200">|</span>
            <a href="#" className="hover:underline">Sales Specifications</a>
            <span className="text-neutral-200">|</span>
            <a href="#" className="hover:underline">Legal Integrity Docs</a>
            <span className="text-neutral-200">|</span>
            <a href="#" className="hover:underline">Site Map Tracker</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default ProductFooter;