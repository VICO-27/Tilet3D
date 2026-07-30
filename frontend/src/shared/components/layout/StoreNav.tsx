import { useState } from "react";
import { Link, useLocation,  } from "react-router-dom";
import { ShoppingBag, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCartStore } from "../../../app/store/useCartStore";
import { CartDrawer } from "../../../features/cart/components/CartDrawer";

const StoreNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);

  const { cartItems } = useCartStore();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const LINKS = [
    { to: "/", label: t("nav.home", "Home") },
    { to: "/products", label: t("nav.collection", "Collection") },
    { to: "/avatar", label: t("nav.fittingRoom", "Fitting Room") },
  ];

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

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
};

export default StoreNav;