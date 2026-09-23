import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Package, Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCartStore } from "../../../app/store/useCartStore";
import { CartDrawer } from "../../../features/cart/components/CartDrawer";
import { useAiSearch } from "../../../features/ai/hooks/useAiSearch";
import { ProductPreviewCard } from "../../../features/ai/components/ProductPreviewCard";

const StoreNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, isSearching, search } = useAiSearch();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { cartItems } = useCartStore();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const LINKS = [
    { to: "/", label: t("nav.home", "Home") },
    { to: "/products", label: t("nav.collection", "Collection") },
    { to: "/avatar", label: t("nav.fittingRoom", "Fitting Room") },
  ];

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        search(value);
      }, 400);
    },
    [search]
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen, closeSearch]);

  // Close on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen, closeSearch]);

  const handleProductSelect = (productId: string) => {
    closeSearch();
    navigate(`/products/${productId}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-purple-500 text-sm font-black text-white">
              ጥ
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">
              Tilet<span className="text-violet-600">3D</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            {LINKS.map((link) => {
              const active =
                link.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                    active
                      ? "text-violet-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-violet-600" />
                  )}
                </Link>
              );
            })}

            {/* AI-powered search */}
            <div ref={searchContainerRef} className="relative">
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label={t("nav.search", "Search")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 w-56 sm:w-72">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 text-violet-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={t("nav.searchPlaceholder", "Search styles, colors, occasions...")}
                    className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button onClick={closeSearch} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {searchOpen && query.trim().length > 0 && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50">
                  {isSearching && results.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {t("nav.searching", "Finding matches...")}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="space-y-2">
                      {results.map((product) => (
                        <div key={product.id} onClick={() => handleProductSelect(product.id)}>
                          <ProductPreviewCard product={product} compact />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {t("nav.noResults", "No matches found — try a different phrase.")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              aria-label={t("nav.shoppingBag", "Shopping Bag")}
              className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors sm:text-xs"
            >
              <ShoppingBag className="h-4 w-4 text-violet-600" />
              <span>{t("nav.bag", "Bag")}</span>
              {itemCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>

            <Link
              to="/orders"
              title={t("nav.orderHistory", "Order History")}
              aria-label={t("nav.orders", "Orders")}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                pathname.startsWith("/orders")
                  ? "bg-violet-50 text-violet-600"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Package className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default StoreNav;