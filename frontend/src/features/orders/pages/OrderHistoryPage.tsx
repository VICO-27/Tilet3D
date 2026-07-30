import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ArrowUpRight, ChevronRight, Clock, CheckCircle2, Truck, XCircle, Search } from "lucide-react";
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

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-8">
        <header className="mb-10">
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
    </div>
  );
};

export default OrderHistoryPage;