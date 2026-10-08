import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import Navbar from "../../../shared/components/layout/Navbar";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { OrderStatus, OrderItemType } from "../api/orderApi";

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "pending": return { color: "text-amber-600 bg-amber-50", icon: Clock, label: "Pending" };
    case "confirmed": return { color: "text-indigo-600 bg-indigo-50", icon: CheckCircle2, label: "Confirmed" };
    case "processing": return { color: "text-blue-600 bg-blue-50", icon: Package, label: "Processing" };
    case "shipped": return { color: "text-violet-600 bg-violet-50", icon: Truck, label: "Shipped" };
    case "delivered": return { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2, label: "Delivered" };
    case "cancelled": return { color: "text-rose-600 bg-rose-50", icon: XCircle, label: "Cancelled" };
    default: return { color: "text-slate-600 bg-slate-50", icon: Clock, label: status };
  }
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { order, isLoading, error } = useOrderDetail(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col pt-12">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-12">
        <Navbar />
        <div className="py-24 text-center text-rose-500">
           {error || "Order not found."}
           <br/>
           <button onClick={() => navigate("/orders")} className="mt-4 text-violet-600 underline">Go Back</button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const formatDate = (isoString: string) => new Date(isoString).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-20 pt-16">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10 md:px-8">

        <div className="mb-10 flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Order {order.order_number}</h1>
            <p className="mt-2 text-sm text-slate-500">Placed on {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" /> {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Items Ordered</h2>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {order.items.map((item: OrderItemType, index: number) => (
                <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 ${index !== order.items.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{item.product_name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.variant_name} {item.color && `• ${item.color}`} {item.size && `• ${item.size}`}</p>
                    <p className="mt-1 text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end mt-2 sm:mt-0">
                    <p className="text-sm font-bold text-slate-900">ETB {Number(item.price).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {order.note && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Customer Note</h3>
                <p className="text-sm text-amber-900/80">{order.note}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-slate-900">Summary</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-slate-900">ETB {Number(order.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-slate-900">ETB {Number(order.shipping_fee).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Tax</span><span className="font-medium text-slate-900">ETB {Number(order.tax).toLocaleString()}</span></div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount</span><span>- ETB {Number(order.discount).toLocaleString()}</span></div>
                )}
                <div className="my-4 border-t border-slate-100"></div>
                <div className="flex justify-between items-center"><span className="font-bold text-slate-900">Total</span><span className="text-xl font-bold text-violet-600">ETB {Number(order.total).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Delivery</h2>
              </div>
              <address className="not-italic text-sm text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900 mb-2">{order.full_name}</p>
                <p>{order.phone}</p>
                <p>{order.house_no ? `House No. ${order.house_no}, ` : ''}{order.woreda ? `Woreda ${order.woreda}` : ''}</p>
                <p>{order.sub_city}, {order.city}</p>
                <p>{order.region} {order.postal_code && `- ${order.postal_code}`}</p>
              </address>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Payment</h2>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">Status</span>
                <span className={`text-sm font-bold ${order.payment_status === 'paid' ? 'text-emerald-600' : order.payment_status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {order.payment_status === 'paid' ? 'Paid via Chapa' : order.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <button onClick={() => navigate("/orders")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </button>
        </div>
      </main>
    </div>
  );
};

export default OrderDetailPage;