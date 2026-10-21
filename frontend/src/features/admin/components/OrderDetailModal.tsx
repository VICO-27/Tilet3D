import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  AlertCircle,
  Shield,
  User,
  MapPin,
  Calendar,
  Loader2,
  ArrowRight,
  Ban,
  RotateCw,
  ShoppingBag,
  Info,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminOrderDetail } from "../types/admin";

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transition state
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrderDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setTransitionError(null);
    setTransitionSuccess(null);
    setShowCancelConfirm(false);
    setCancelReason("");

    try {
      const data = await adminApi.getOrderById(id);
      setOrder(data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setError(
        axiosErr?.response?.data?.detail ||
          axiosErr?.message ||
          "Failed to load order details."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    } else {
      setOrder(null);
      setError(null);
      setTransitionError(null);
      setTransitionSuccess(null);
      setShowCancelConfirm(false);
    }
  }, [isOpen, orderId, fetchOrderDetails]);

  if (!isOpen) return null;

  const formatCurrency = (val?: string | number) => {
    if (!val) return "ETB 0.00";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return `ETB ${val}`;
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const handleTransition = async (targetStatus: string, reason?: string) => {
    if (!order) return;
    setTransitioning(true);
    setTransitionError(null);
    setTransitionSuccess(null);

    try {
      const res = await adminApi.transitionOrderStatus(
        order.id,
        targetStatus,
        reason
      );
      setOrder(res.order);
      setTransitionSuccess(res.message);
      setShowCancelConfirm(false);
      setCancelReason("");
      onOrderUpdated();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setTransitionError(
        axiosErr?.response?.data?.detail ||
          axiosErr?.message ||
          `Failed to transition order status to ${targetStatus}.`
      );
    } finally {
      setTransitioning(false);
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          icon: Clock,
          label: "Pending",
        };
      case "confirmed":
        return {
          bg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
          icon: CheckCircle2,
          label: "Confirmed",
        };
      case "processing":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          icon: Package,
          label: "Processing",
        };
      case "shipped":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-300",
          icon: Truck,
          label: "Shipped",
        };
      case "delivered":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          icon: CheckCircle2,
          label: "Delivered",
        };
      case "cancelled":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          icon: Ban,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-white/5 border-white/10 text-gray-300",
          icon: Info,
          label: status,
        };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
      case "pending":
        return "bg-amber-500/10 border-amber-500/30 text-amber-300";
      case "failed":
        return "bg-rose-500/10 border-rose-500/30 text-rose-300";
      case "refunded":
        return "bg-neutral-500/10 border-neutral-500/30 text-neutral-300";
      default:
        return "bg-white/5 border-white/10 text-gray-300";
    }
  };

  const getTransitionButtonConfig = (targetStatus: string) => {
    switch (targetStatus) {
      case "confirmed":
        return {
          label: "Confirm Order",
          className:
            "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
          icon: CheckCircle2,
        };
      case "processing":
        return {
          label: "Start Processing",
          className:
            "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20",
          icon: Package,
        };
      case "shipped":
        return {
          label: "Mark as Shipped",
          className:
            "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Mark as Delivered",
          className:
            "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: "Cancel Order",
          className:
            "bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300",
          icon: Ban,
        };
      default:
        return {
          label: `Transition to ${targetStatus}`,
          className: "bg-white/10 hover:bg-white/20 text-white",
          icon: ArrowRight,
        };
    }
  };

  const fulfillmentBadge = order ? getFulfillmentBadge(order.status) : null;
  const FulfillmentIcon = fulfillmentBadge?.icon || Info;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ink border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-plum-500/10 border border-plum-500/20 text-plum-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-serif font-bold text-white">
                  {order ? order.order_number : "Order Details"}
                </h2>
                {order && fulfillmentBadge && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${fulfillmentBadge.bg}`}
                  >
                    <FulfillmentIcon className="w-3 h-3" />
                    {fulfillmentBadge.label}
                  </span>
                )}
                {order && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getPaymentBadge(
                      order.payment_status
                    )}`}
                  >
                    Payment: {order.payment_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                {order && (
                  <>
                    <Calendar className="w-3 h-3" />
                    <span>Placed {formatDate(order.created_at)}</span>
                    <span className="text-white/20">•</span>
                    <span>Order ID: {order.id}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-plum-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading order details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
              {orderId && (
                <button
                  onClick={() => fetchOrderDetails(orderId)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Retry
                </button>
              )}
            </div>
          )}

          {order && !loading && (
            <>
              {/* Transition Feedback Messages */}
              {transitionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{transitionSuccess}</span>
                </div>
              )}
              {transitionError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transitionError}</span>
                </div>
              )}

              {/* Fulfillment Actions Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-plum-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Fulfillment Status Workflow
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Enforced by OrderLifecycle state machine
                  </span>
                </div>

                {order.allowed_transitions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {order.allowed_transitions.map((target) => {
                      if (target === "cancelled") {
                        return (
                          <div key={target} className="flex items-center gap-2">
                            {!showCancelConfirm ? (
                              <button
                                type="button"
                                disabled={transitioning}
                                onClick={() => setShowCancelConfirm(true)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Cancel Order
                              </button>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                                <input
                                  type="text"
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  placeholder="Reason (optional)"
                                  className="px-2.5 py-1 text-xs rounded bg-ink border border-rose-500/40 text-white placeholder-gray-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={transitioning}
                                  onClick={() => handleTransition("cancelled", cancelReason)}
                                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  {transitioning ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  Confirm Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowCancelConfirm(false)}
                                  className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                                >
                                  Back
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      const btn = getTransitionButtonConfig(target);
                      const Icon = btn.icon;
                      return (
                        <button
                          key={target}
                          type="button"
                          disabled={transitioning}
                          onClick={() => handleTransition(target)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 ${btn.className}`}
                        >
                          {transitioning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-500" />
                    Order has reached a terminal fulfillment status ({order.status}). No further transitions allowed.
                  </div>
                )}
              </div>

              {/* Customer & Shipping Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <User className="w-4 h-4 text-plum-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Customer Information
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white font-medium">{order.full_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white font-medium">{order.customer_email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white font-medium">{order.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer ID:</span>
                      <span className="text-gray-400 font-mono text-[11px] truncate max-w-[200px]">
                        {order.customer_id || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <MapPin className="w-4 h-4 text-plum-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Delivery Address
                    </h3>
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p className="text-white font-medium">
                      {[order.city, order.region].filter(Boolean).join(", ") || "No city/region"}
                    </p>
                    <p className="text-gray-400">
                      {[
                        order.sub_city ? `Sub-city: ${order.sub_city}` : null,
                        order.woreda ? `Woreda: ${order.woreda}` : null,
                        order.house_no ? `House No: ${order.house_no}` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "No specific address lines"}
                    </p>
                    {order.postal_code && (
                      <p className="text-gray-400">Postal Code: {order.postal_code}</p>
                    )}
                    {order.note && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-gray-400 font-semibold block">
                          Delivery Note:
                        </span>
                        <p className="text-amber-200/90 italic text-[11px] mt-0.5">
                          "{order.note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Fit Snapshot (if present) */}
              {order.avatar_snapshot && Object.keys(order.avatar_snapshot).length > 0 && (
                <div className="p-4 rounded-xl bg-plum-500/[0.04] border border-plum-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-plum-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-plum-400 animate-pulse" />
                      3D Avatar Fitting Measurements
                    </h3>
                    <span className="text-[10px] text-plum-300/70">Custom tailored snapshot</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(order.avatar_snapshot).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col"
                      >
                        <span className="text-[10px] text-gray-400 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-white font-medium font-mono text-xs mt-0.5">
                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-plum-400" />
                  Order Items ({order.items.length})
                </h3>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-gray-400">
                        <th className="py-2.5 px-4 font-medium">Item</th>
                        <th className="py-2.5 px-3 font-medium">SKU</th>
                        <th className="py-2.5 px-3 font-medium">Variant</th>
                        <th className="py-2.5 px-3 font-medium text-right">Price</th>
                        <th className="py-2.5 px-3 font-medium text-center">Qty</th>
                        <th className="py-2.5 px-4 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-medium text-white block">
                              {item.product_name}
                            </span>
                            {item.variant_name && (
                              <span className="text-[11px] text-gray-400 block">
                                {item.variant_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-400 text-[11px]">
                            {item.sku}
                          </td>
                          <td className="py-3 px-3 text-gray-300">
                            {[item.color, item.size].filter(Boolean).join(" / ") || "Standard"}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-white">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-white">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Totals & Read-Only Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Payment Overview (Read-Only) */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                      Payment Record (Read-Only)
                    </span>
                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      Chapa Protected
                    </span>
                  </div>

                  {order.payment ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gateway:</span>
                        <span className="text-white font-medium uppercase">
                          {order.payment.provider}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Status:</span>
                        <span
                          className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] border ${getPaymentBadge(
                            order.payment.status
                          )}`}
                        >
                          {order.payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Txn / Ref:</span>
                        <span className="font-mono text-gray-300 text-[11px]">
                          {order.payment.transaction_id || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount Charged:</span>
                        <span className="font-mono text-white font-medium">
                          {formatCurrency(order.payment.amount)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-xs">
                      No external payment record linked. Payment status: {order.payment_status}.
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 pt-1 leading-relaxed">
                    Notice: Payments are verified via cryptographic webhooks from Chapa. Staff cannot manually mark orders as paid.
                  </p>
                </div>

                {/* Totals Summary */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Items Subtotal:</span>
                    <span className="font-mono text-gray-200">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Fee:</span>
                    <span className="font-mono text-gray-200">
                      {formatCurrency(order.shipping_fee)}
                    </span>
                  </div>
                  {parseFloat(order.tax) > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Tax:</span>
                      <span className="font-mono text-gray-200">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  {parseFloat(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-plum-300">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
