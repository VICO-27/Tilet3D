import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RotateCw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  Clock,
  Package,
  Truck,
  Ban,
  Info,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminOrderListItem } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
import OrderDetailModal from "../components/OrderDetailModal";
import AccessDenied from "../components/AccessDenied";
import { useAuthStore } from "@/app/store/useAuthStore";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const AdminOrdersPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Detail Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageSize = 15;

  const fetchOrders = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getOrders({
          page,
          search,
          status: selectedStatus,
          payment_status: selectedPaymentStatus,
        });

        setOrders(res.results);
        setTotalCount(res.count);
        setTotalPages(Math.max(1, Math.ceil(res.count / pageSize)));
      } catch (err: unknown) {
        const axiosErr = err as AxiosLikeError;
        if (axiosErr?.response?.status === 403) {
          setIsForbidden(true);
        } else {
          setError(
            axiosErr?.response?.data?.detail ||
              axiosErr?.message ||
              "Failed to load order management list."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, selectedStatus, selectedPaymentStatus]
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePaymentFilterChange = (pStatus: string) => {
    setSelectedPaymentStatus(pStatus);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedPaymentStatus("");
    setCurrentPage(1);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleOrderUpdated = () => {
    setNotification({
      type: "success",
      text: "Order fulfillment status updated successfully.",
    });
    setTimeout(() => setNotification(null), 4000);
    fetchOrders(currentPage);
  };

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
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
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

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Order Management"
      subtitle="Track customer orders, delivery details, and safe fulfillment workflows"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between transition-all ${
              notification.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs underline ml-4 hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, email, phone..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-ink border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
              >
                Search
              </button>
            </form>

            {/* Refresh Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchOrders(currentPage)}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Fulfillment:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-plum-500 transition-colors"
            >
              <option value="">All Fulfillment Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex items-center gap-1.5 text-gray-400 ml-2">
              <span>Payment:</span>
            </div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => handlePaymentFilterChange(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-plum-500 transition-colors"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {(search || selectedStatus || selectedPaymentStatus) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-400 hover:text-white underline ml-auto transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchOrders(currentPage)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Order Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                        <span className="text-xs">Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag className="w-8 h-8 text-gray-600" />
                        <span className="text-sm font-medium text-gray-300">
                          No orders found
                        </span>
                        <span className="text-xs text-gray-500">
                          {search || selectedStatus || selectedPaymentStatus
                            ? "Try adjusting your search criteria or active filters."
                            : "Customer orders will appear here once placed."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const fulfillmentBadge = getFulfillmentBadge(order.status);
                    const FulfillmentIcon = fulfillmentBadge.icon;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <td className="py-4 px-4 sm:px-6 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-plum-300">
                              {order.order_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-white truncate max-w-[160px]">
                              {order.full_name || "Guest Customer"}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate max-w-[160px]">
                              {order.customer_email || "No email"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 font-mono text-gray-300">
                            {order.item_count}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-medium text-white text-xs whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getPaymentBadge(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${fulfillmentBadge.bg}`}
                          >
                            <FulfillmentIcon className="w-3 h-3" />
                            {fulfillmentBadge.label}
                          </span>
                        </td>
                        <td
                          className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="px-3 py-1.5 rounded-lg bg-plum-500/10 hover:bg-plum-500/20 text-plum-300 border border-plum-500/20 text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && orders.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
              <div>
                Showing{" "}
                <span className="text-white font-medium">
                  {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
                </span>{" "}
                to{" "}
                <span className="text-white font-medium">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{" "}
                of <span className="text-white font-medium">{totalCount}</span> orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrderId(null);
        }}
        onOrderUpdated={handleOrderUpdated}
      />
    </AdminLayout>
  );
};

export default AdminOrdersPage;
