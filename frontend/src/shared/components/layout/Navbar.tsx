import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Collection" },
  { to: "/avatar", label: "Fitting Room" },
  { to: "/orders", label: "Orders" },
];

const SUGGESTIONS = [
  "Habesha Kemis",
  "Tibeb Zuria",
  "Netela",
  "Suri Set",
  "Gabi",
];

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runSearch = (q?: string) => {
    const term = (q ?? query).trim();
    setSearchOpen(false);
    setQuery("");
    navigate(`/products${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.06] bg-white/80 backdrop-blur-xl">
      {/* Height reduced from h-[68px] to h-[48px] for an ultra-clean luxury footprint */}
      <div className="mx-auto flex h-[48px] max-w-[1400px] items-center justify-between px-6 md:px-10">
        
        {/* Left — logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* Scaled down signature badge to seamlessly balance the slimmer bar layout */}
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-[11px] font-black text-white">
            ጥ
          </span>
          <span className="display text-base font-semibold tracking-tight text-ink">
            Tilet<span className="text-plum-600">3D</span>
          </span>
        </Link>

        {/* Center — nav links */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative text-[12px] font-medium tracking-wide transition-colors ${
                isActive(link.to) ? "text-ink" : "text-ink/55 hover:text-ink"
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                /* Adjusted active line offset to dock perfectly at the base of the 48px header boundary */
                <span className="absolute -bottom-[15px] left-0 right-0 h-px bg-ink" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right — actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              searchOpen
                ? "bg-ink text-white"
                : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
            }`}
          >
            <Search className="h-[15px] w-[15px]" />
          </button>
          <Link
            to="/orders"
            aria-label="Bag"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink"
          >
            <ShoppingBag className="h-[15px] w-[15px]" />
          </Link>
          <Link
            to="/account"
            className="ml-1 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-plum-600"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Account</span>
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:bg-ink/[0.04] md:hidden"
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {/* Search popup */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              /* Updated offset position to line up flush under the brand-new header bounds */
              className="fixed inset-0 top-[48px] z-40 bg-ink/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              /* Updated offset position here as well */
              className="absolute inset-x-0 top-[48px] z-50 border-b border-ink/10 bg-white shadow-xl"
            >
              <div className="mx-auto max-w-2xl px-6 py-6">
                <div className="flex items-center gap-3 border-b border-ink/15 pb-3">
                  <Search className="h-5 w-5 text-ink/40" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                    placeholder="Search couture, brands, fabrics…"
                    className="w-full bg-transparent text-lg text-ink placeholder-ink/35 focus:outline-none"
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="text-[11px] font-bold uppercase tracking-wider text-ink/40 hover:text-ink"
                  >
                    Esc
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
                    Popular
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => runSearch(s)}
                        className="rounded-full border border-ink/10 px-3.5 py-1.5 text-sm text-ink/70 transition-colors hover:border-plum-300 hover:bg-plum-50 hover:text-plum-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-ink/[0.06] bg-white md:hidden">
          <nav className="flex flex-col px-6 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm font-medium ${
                  isActive(link.to) ? "text-plum-600" : "text-ink/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;