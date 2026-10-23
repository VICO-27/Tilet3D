import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, Package } from "lucide-react";
import { useCartStore } from "../../../app/store/useCartStore";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { CheckoutModal } from "./CheckoutModal";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { cartItems, fetchCart, updateQuantity, removeItem, cartTotal, loading } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col h-full max-h-[100dvh]"
              >
                <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-6 border-b border-stone-100 bg-white shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-stone-100 text-stone-900">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg font-medium tracking-tight text-stone-900">
                        {t("cart.title", "Shopping Bag")}
                      </h2>
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-stone-400 font-medium">
                        {cartItems.length} {cartItems.length === 1 ? t("cart.piece", "Piece") : t("cart.pieces", "Pieces")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    aria-label="Close cart"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overscroll-contain">
                  {loading && cartItems.length === 0 ? (
                    <div className="flex h-48 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="text-center py-20 sm:py-24 space-y-4">
                      <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-stone-50 text-stone-400">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div className="px-4">
                        <p className="font-serif text-base text-stone-900">{t("cart.emptyTitle", "Your bag is empty")}</p>
                        <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">{t("cart.emptyDesc", "Discover our latest Habesha couture collection.")}</p>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate("/products");
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-violet-600 transition-colors"
                      >
                        {t("cart.exploreBtn", "Explore Collection")}
                      </button>

                      {!user && (
                        <div className="pt-2">
                          <p className="text-xs text-stone-400">
                            Already have an account?{" "}
                            <button
                              onClick={() => {
                                onClose();
                                navigate("/account");
                              }}
                              className="font-medium text-stone-900 underline underline-offset-4 hover:text-violet-600 transition-colors"
                            >
                              Sign in
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const price = Number(item.variant?.price || 0);
                      const subtotal = price * item.quantity;

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          key={item.id}
                          className="flex gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-stone-100 group"
                        >
                          <div className="h-20 w-16 sm:h-24 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60">
                            {item.image ? (
                              <img src={item.image} alt={item.product?.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                                <h3 className="font-serif text-xs sm:text-sm font-medium text-stone-900 truncate">
                                  {item.product?.name || t("cart.defaultItemName", "Couture Piece")}
                                </h3>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-stone-300 hover:text-rose-500 transition-colors p-1 shrink-0 -mt-1 -mr-1"
                                  title="Remove item"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate">
                                {item.variant?.name} {item.variant?.color && `• ${item.variant.color}`} {item.variant?.size && `• ${item.variant.size}`}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                              <div className="flex items-center border border-stone-200 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-50 shrink-0">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  className="text-stone-400 hover:text-stone-900 transition-colors p-0.5"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-semibold text-stone-900 w-5 sm:w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="text-stone-400 hover:text-stone-900 transition-colors p-0.5"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <span className="text-xs sm:text-sm font-bold text-stone-900 whitespace-nowrap">
                                ETB {subtotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-stone-100 px-4 sm:px-8 py-4 sm:py-6 bg-stone-50/50 space-y-3 sm:space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shrink-0">
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] sm:text-xs text-stone-500">
                        <span>{t("cart.shippingLabel", "Shipping & Custom Tailoring")}</span>
                        <span className="font-medium text-stone-900">{t("cart.calculatedCheckout", "Calculated at checkout")}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-stone-200/60">
                        <span className="font-serif text-sm sm:text-base text-stone-900">{t("cart.subtotal", "Subtotal")}</span>
                        <span className="font-serif text-base sm:text-lg font-bold text-stone-900">ETB {cartTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        setCheckoutOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2.5 sm:gap-3 rounded-full bg-stone-900 py-3 sm:py-4 text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-white hover:bg-violet-600 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.99]"
                    >
                      {t("cart.checkoutBtn", "Proceed to Checkout")}
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(orderId) => {
          setCheckoutOpen(false);
          navigate(`/orders/${orderId}`);
        }}
      />
    </>
  );
};