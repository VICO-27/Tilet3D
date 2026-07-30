import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag, User, Menu, X, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCartStore } from "../../../app/store/useCartStore";
import { CartDrawer } from "../../../features/cart/components/CartDrawer";

const Navbar = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { cartItems, fetchCart } = useCartStore();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const LINKS = [
    { to: "/", label: t("nav.home", "Home") },
    { to: "/products", label: t("nav.collection", "Collection") },
    { to: "/avatar", label: t("nav.fittingRoom", "Fitting Room") },
  ];

  const SUGGESTIONS = [
    t("nav.suggestions.kemis", "Habesha Kemis"),
    t("nav.suggestions.zuria", "Tibeb Zuria"),
    t("nav.suggestions.netela", "Netela"),
    t("nav.suggestions.suri", "Suri Set"),
    t("nav.suggestions.gabi", "Gabi"),
  ];

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

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
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[48px] max-w-[1400px] items-center justify-between px-6 md:px-10">
          
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-[11px] font-black text-white">
              ጥ
            </span>
            <span className="display text-base font-semibold tracking-tight text-ink">
              Tilet<span className="text-plum-600">3D</span>
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
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
                  <span className="absolute -bottom-[15px] left-0 right-0 h-px bg-ink" />
                )}
              </Link>
            ))}

            <button
              onClick={() => setCartOpen(true)}
              aria-label={t("nav.shoppingBag", "Shopping Bag")}
              className="relative flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-ink/55 hover:text-ink transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-plum-600" />
              <span>{t("nav.bag", "Bag")}</span>
              {itemCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-plum-600 px-1 text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </nav>

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
              aria-label={t("nav.orderHistory", "Order History")}
              title={t("nav.orderHistory", "Order History")}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isActive("/orders")
                  ? "bg-plum-50 text-plum-600"
                  : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
              }`}
            >
              <Package className="h-[15px] w-[15px]" />
            </Link>

            <Link
              to="/account"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-plum-600"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.account", "Account")}</span>
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

        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(false)}
                className="fixed inset-0 top-[48px] z-40 bg-ink/20 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                      placeholder={t("nav.searchPlaceholder", "Search couture, brands, fabrics…")}
                      className="w-full bg-transparent text-lg text-ink placeholder-ink/35 focus:outline-none"
                    />
                    <button
                      onClick={() => setSearchOpen(false)}
                      className="text-[11px] font-bold uppercase tracking-wider text-ink/40 hover:text-ink"
                    >
                      {t("nav.esc", "Esc")}
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
                      {t("nav.popular", "Popular")}
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
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setCartOpen(true);
                }}
                className="flex items-center justify-between py-3 text-sm font-medium text-ink/70"
              >
                <span>{t("nav.shoppingBag", "Shopping Bag")}</span>
                {itemCount > 0 && (
                  <span className="rounded-full bg-plum-600 px-2 py-0.5 text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </button>
              <Link
                to="/orders"
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-sm font-medium ${
                  isActive("/orders") ? "text-plum-600" : "text-ink/70"
                }`}
              >
                {t("nav.orders", "Orders")}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
};

export default Navbar;