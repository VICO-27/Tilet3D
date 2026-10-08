import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ArrowUpRight, ChevronRight, Clock, CheckCircle2,
  Truck, XCircle, Search, LogIn, ShoppingBag, CreditCard,
  MapPin, User, ArrowLeft
} from "lucide-react";
import Navbar from "../../../shared/components/layout/Navbar";
import { useOrders } from "../hooks/useOrders";
import { OrderStatus, OrderListType } from "../api/orderApi";

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "pending": return { color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock, label: "Pending" };
    case "confirmed": return { color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: CheckCircle2, label: "Confirmed" };
    case "processing": return { color: "text-blue-600 bg-blue-50 border-blue-200", icon: Package, label: "Processing" };
    case "shipped": return { color: "text-violet-600 bg-violet-50 border-violet-200", icon: Truck, label: "Shipped" };
    case "delivered": return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2, label: "Delivered" };
    case "cancelled": return { color: "text-rose-600 bg-rose-50 border-rose-200", icon: XCircle, label: "Cancelled" };
    default: return { color: "text-slate-600 bg-slate-50 border-slate-200", icon: Clock, label: status };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Unauthenticated guided empty state — shown when a non-signed-in user lands
// on /orders. Replaces the raw "session_expired" error string with a luxury
// branded flow that explains the path to their first order.
// ─────────────────────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { icon: User,        label: "Sign in to your account",       detail: "Use email or continue with Google" },
  { icon: ShoppingBag, label: "Browse the collection",         detail: "Explore handcrafted Ethiopian pieces" },
  { icon: Package,     label: "Try pieces on your avatar",     detail: "See how it fits before you order" },
  { icon: CreditCard,  label: "Checkout & pay securely",       detail: "Multiple payment methods accepted" },
  { icon: MapPin,      label: "Track your order right here",   detail: "Real-time updates from workshop to door" },
];

function UnauthenticatedOrdersView() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl px-6 py-16 text-center"
    >
      <button
        onClick={() => navigate(-1)}
        className="group mb-12 mx-auto flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors duration-300"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white group-hover:border-slate-400 transition-colors duration-300">
          <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Back
      </button>

      {/* Brand mark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#161616] shadow-xl shadow-black/20"
      >
        <Package className="h-7 w-7 text-amber-400" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-600 mb-3"
      >
        Your Atelier
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
      >
        Your orders live here
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="mt-3 text-sm leading-relaxed text-slate-500"
      >
        Sign in to track your bespoke orders from the workshop to your door.
      </motion.p>

      {/* Numbered steps */}
      <motion.ol
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        className="mt-10 space-y-3 text-left"
      >
        {ONBOARDING_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.42 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
            >
              {/* Step number badge */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161616] text-xs font-bold text-amber-400">
                {i + 1}
              </span>
              {/* Step icon */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Icon className="h-4 w-4" />
              </span>
              {/* Step text */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{step.detail}</p>
              </div>
            </motion.li>
          );
        })}
      </motion.ol>

      {/* Primary CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.78 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/account")}
        className="mt-10 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#161616] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-violet-600 sm:w-auto sm:px-10"
      >
        <LogIn className="h-4 w-4" />
        Sign In to Continue
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
        className="mt-5 text-xs text-slate-400"
      >
        New to Tilet3D?{" "}
        <button
          onClick={() => navigate("/account")}
          className="font-semibold text-violet-600 hover:underline"
        >
          Create a free account
        </button>
      </motion.p>
    </motion.div>
  );
}

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const { orders, isLoading, error } = useOrders();

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o: OrderListType) => o.status === filter);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-20 pt-16">
      <Navbar />

      {/* ─── Unauthenticated state ─── */}
      <AnimatePresence mode="wait">
        {error === "session_expired" && !isLoading && (
          <UnauthenticatedOrdersView key="unauth" />
        )}
      </AnimatePresence>

      {/* ─── All other states (authenticated) ─── */}
      {error !== "session_expired" && (
        <main className="mx-auto max-w-4xl px-6 py-12 md:px-8">
          <header className="mb-10">
            <button
              onClick={() => navigate(-1)}
              className="group mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white group-hover:border-slate-400 transition-colors duration-300">
                <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
              </div>
              Back
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-600 mb-3">Your Atelier</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Order History</h1>

              {!isLoading && orders.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                  {["all", "pending", "confirmed", "processing", "shipped", "delivered"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as typeof filter)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
                        filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="mt-4 text-sm text-slate-500">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500">{error}</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Package className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-semibold">Nothing here yet</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">Explore the collection, try a piece on your avatar, and place your first custom-fit order.</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/products")}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-600"
              >
                Browse Collection
                <ArrowUpRight className="h-4 w-4" />
              </motion.button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center">
              <Search className="h-8 w-8 mb-3 opacity-20" />
              <p>No orders found for this status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: OrderListType, i: number) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.2) }}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-violet-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-mono text-sm font-bold text-slate-900">{order.order_number}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-500 flex items-center gap-3">
                          <span>{formatDate(order.created_at)}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span>{order.item_count} {order.item_count === 1 ? 'Item' : 'Items'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold text-slate-900">ETB {Number(order.total).toLocaleString()}</p>
                          <p className={`text-xs font-medium ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {order.payment_status === 'paid' ? 'Payment Successful' : 'Payment Pending'}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default OrderHistoryPage;