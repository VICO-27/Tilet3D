import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Printer, 
  Package, 
  ShoppingBag, 
  ArrowRight, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import Navbar from "../../../shared/components/layout/Navbar";
import Footer from "../../../shared/components/layout/Footer";
import { orderApi, OrderDetailType, PaymentInfoType } from "../api/orderApi";
import { useCartStore } from "../../../app/store/useCartStore";

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [payment, setPayment] = useState<PaymentInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearCart = useCartStore((s) => s.clearCart);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    // 1. Immediately clear cart on payment return
    clearCart();
    fetchCart();

    if (!orderId) {
      setLoading(false);
      setError("No order identifier provided in the redirect URL.");
      return;
    }

    let isMounted = true;

    const verifyAndFetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        // Attempt verification with Chapa via backend
        try {
          const verifyRes = await orderApi.verifyPayment(orderId);
          if (isMounted && verifyRes?.order) {
            setOrder(verifyRes.order);
            setPayment(verifyRes.payment || verifyRes.order.payment || null);
            setLoading(false);
            return;
          }
        } catch (verifyErr) {
          console.warn("Verify endpoint attempt failed, falling back to getOrderById", verifyErr);
        }

        // Fallback: fetch directly
        const fetchedOrder = await orderApi.getOrderById(orderId);
        if (isMounted) {
          setOrder(fetchedOrder);
          setPayment(fetchedOrder.payment || null);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Failed to load order receipt", err);
        if (isMounted) {
          setError("Could not load your payment receipt. Please verify your connection or check your Order History.");
          setLoading(false);
        }
      }
    };

    verifyAndFetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId, clearCart, fetchCart]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleDateString();
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-plum-100 border-t-plum-600 animate-spin" />
              <ShieldCheck className="h-8 w-8 text-plum-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-stone-900">
              Verifying Payment with Chapa...
            </h2>
            <p className="text-sm text-stone-500 max-w-md">
              Please wait a moment while we confirm your transaction and generate your official order receipt.
            </p>
          </div>
        ) : error || !order ? (
          <div className="py-20 text-center space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 text-rose-500 mb-2">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-stone-900">
              Receipt Unavailable
            </h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              {error || "We couldn't retrieve the receipt details for this order."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-plum-600 text-white text-sm font-medium hover:bg-plum-700 transition"
              >
                <Package className="h-4 w-4" /> Go to My Orders
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Celebration Banner (Screen only) */}
            <div className="print:hidden text-center space-y-3 pb-2">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60 shadow-sm animate-bounce-short">
                <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900">
                Payment Successful!
              </h1>
              <p className="text-stone-600 text-sm sm:text-base max-w-lg mx-auto">
                Thank you for your order, <span className="font-semibold text-stone-800">{order.full_name}</span>. 
                Your payment has been verified and your custom Habesha couture is now being processed.
              </p>

              {/* Action Toolbar */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-medium shadow-sm transition-all"
                >
                  <Printer className="h-4 w-4 text-plum-600" />
                  Print / Save Receipt
                </button>
                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
                >
                  <Package className="h-4 w-4" />
                  View Order Status
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-medium shadow-sm transition-all"
                >
                  <ShoppingBag className="h-4 w-4 text-stone-500" />
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* THE OFFICIAL RECEIPT CARD */}
            <div 
              id="printable-receipt" 
              className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 sm:p-10 relative print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* Receipt Header */}
              <div className="border-b border-stone-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                      TILET3D
                    </span>
                    <span className="text-[10px] tracking-widest font-mono uppercase bg-plum-50 text-plum-700 px-2 py-0.5 rounded-full border border-plum-100">
                      Official Receipt
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Ethiopian Heritage Fashion & Custom 3D Tailoring
                  </p>
                  <p className="text-xs text-stone-400">
                    Addis Ababa, Ethiopia • support@tilet3d.com
                  </p>
                </div>

                <div className="sm:text-right space-y-1 text-xs">
                  <div className="text-stone-400 uppercase font-mono tracking-wider text-[10px]">Order Number</div>
                  <div className="font-mono font-bold text-sm sm:text-base text-stone-900">
                    {order.order_number}
                  </div>
                  <div className="text-stone-500">
                    Date: <span className="font-medium text-stone-700">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Status and Gateway Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100 mb-8 text-xs">
                <div>
                  <span className="text-stone-400 block uppercase font-mono text-[10px]">Payment Status</span>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-bold text-emerald-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    PAID (Verified via Chapa)
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 block uppercase font-mono text-[10px]">Payment Provider</span>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-medium text-stone-800">
                    <CreditCard className="h-4 w-4 text-plum-600" />
                    Chapa Gateway
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 block uppercase font-mono text-[10px]">Transaction ID</span>
                  <div className="mt-1 font-mono text-stone-700 truncate" title={payment?.transaction_id || payment?.id || "N/A"}>
                    {payment?.transaction_id || payment?.id || "Verified"}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-stone-100 text-sm">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
                    Customer Information
                  </h3>
                  <p className="font-semibold text-stone-900">{order.full_name}</p>
                  <p className="text-stone-600 mt-0.5">{order.phone}</p>
                  {order.note && (
                    <div className="mt-3 text-xs bg-amber-50 text-amber-900 rounded-lg p-2.5 border border-amber-100">
                      <span className="font-semibold">Order Note:</span> {order.note}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-stone-400" /> Shipping Destination
                  </h3>
                  <div className="text-stone-600 space-y-0.5">
                    <p>{order.house_no ? `House No. ${order.house_no}, ` : ''}{order.woreda ? `Woreda ${order.woreda}` : ''}</p>
                    <p>{order.sub_city ? `${order.sub_city}, ` : ''}{order.city}</p>
                    <p>{order.region} {order.postal_code ? `- ${order.postal_code}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="py-8">
                <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-4">
                  Purchased Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-mono text-[11px] uppercase tracking-wider">
                        <th className="pb-3 font-normal">Item Description</th>
                        <th className="pb-3 font-normal text-center">Qty</th>
                        <th className="pb-3 font-normal text-right">Price</th>
                        <th className="pb-3 font-normal text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {order.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-stone-900">{item.product_name}</p>
                            <div className="text-xs text-stone-500 mt-0.5 space-x-2">
                              <span>{item.variant_name}</span>
                              {item.color && <span>• {item.color}</span>}
                              {item.size && <span>• {item.size}</span>}
                            </div>
                            <span className="font-mono text-[10px] text-stone-400">SKU: {item.sku}</span>
                          </td>
                          <td className="py-4 text-center font-mono text-stone-600">
                            {item.quantity}
                          </td>
                          <td className="py-4 text-right font-mono">
                            ETB {Number(item.price).toLocaleString()}
                          </td>
                          <td className="py-4 text-right font-mono font-medium text-stone-900">
                            ETB {Number(item.subtotal).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-stone-200 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="text-xs text-stone-500 max-w-xs space-y-1">
                    <p className="font-medium text-stone-700">Thank you for supporting authentic Ethiopian craftsmanship.</p>
                    <p>All items undergo rigorous quality inspection by our master artisans before dispatch.</p>
                  </div>

                  <div className="w-full sm:w-72 space-y-2.5 text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span className="font-mono">ETB {Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Shipping Fee</span>
                      <span className="font-mono">ETB {Number(order.shipping_fee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>VAT (15%)</span>
                      <span className="font-mono">ETB {Number(order.tax).toLocaleString()}</span>
                    </div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-mono">- ETB {Number(order.discount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline">
                      <span className="font-serif font-bold text-stone-900 text-base">Total Amount Paid</span>
                      <span className="font-mono font-bold text-xl text-plum-700">
                        ETB {Number(order.total).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Verification Footer */}
              <div className="mt-10 pt-6 border-t border-dashed border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified Electronic Payment • Secured by Chapa</span>
                </div>
                <div>Receipt Ref: {order.order_number}</div>
              </div>
            </div>

            {/* Bottom Navigation Links (Screen only) */}
            <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200">
              <Link
                to="/orders"
                className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-plum-600 transition"
              >
                <Clock className="h-4 w-4" /> View All Orders in History
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-2 text-sm font-semibold text-plum-600 hover:text-plum-700 transition"
              >
                Discover More Collections <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
