import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Trash2, ArrowUpRight, Truck } from "lucide-react";

import StoreNav from "../../../shared/components/layout/StoreNav";
import { useAvatarStore } from "../../avatar/store/useAvatarStore";

const STATUS_STYLES: Record<string, string> = {
  Processing: "bg-amber-50 text-amber-600 border-amber-100",
  Shipped: "bg-sky-50 text-sky-600 border-sky-100",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useAvatarStore();

  const total = orders.reduce((sum, o) => sum + o.clothing.price, 0);

  const clear = () => {
    if (window.confirm("Clear your entire order history?")) setOrders([]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <StoreNav />

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-500">
              Your Atelier
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Order History
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {orders.length === 0
                ? "No bespoke orders yet."
                : `${orders.length} order${orders.length > 1 ? "s" : ""} · ETB ${total.toLocaleString()} total`}
            </p>
          </div>

          {orders.length > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 transition-colors hover:bg-rose-50 sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          )}
        </div>

        {/* Body */}
        {orders.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Package className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-semibold">
              Nothing here yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              Explore the collection, try a piece on your avatar, and place your
              first custom-fit order.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-600"
            >
              Browse Collection
              <ArrowUpRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {o.clothing.image && (
                    <img
                      src={o.clothing.image}
                      alt={o.clothing.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-600">
                      {o.id}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        STATUS_STYLES[o.status] ?? STATUS_STYLES.Processing
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">
                    {o.clothing.brand}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-slate-900">
                    {o.clothing.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Truck className="h-3.5 w-3.5" />
                    Ordered {o.date} · for {o.profile.nickname} ({o.profile.height}
                    cm)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {o.clothing.currency ?? "ETB"}{" "}
                    {o.clothing.price.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Custom fit
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrderHistoryPage;
