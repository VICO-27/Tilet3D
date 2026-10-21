import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  RotateCw,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  MapPin,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminCustomer, AdminCustomerDetail } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
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

export const AdminCustomersPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pageSize = 15;

  const fetchCustomers = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getCustomers({
          page,
          search,
        });
        setCustomers(res.results);
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
              "Failed to load customers directory."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search]
  );

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [fetchCustomers, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers(1);
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    setCustomerDetail(null);
    try {
      const data = await adminApi.getCustomerById(id);
      setCustomerDetail(data);
    } catch {
      // failed to load detail
    } finally {
      setDetailLoading(false);
    }
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

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Customer Directory"
      subtitle="Privacy-conscious customer account insights, verified delivery addresses, and order history"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or email..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-ink border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              Search
            </button>
          </form>

          <button
            onClick={() => fetchCustomers(currentPage)}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchCustomers(currentPage)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Total Spent</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                      <span className="text-xs">Loading customer directory...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">
                        No customers found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-plum-600/20 border border-plum-500/30 flex items-center justify-center text-plum-300 font-semibold text-xs uppercase">
                          {c.full_name ? c.full_name[0] : "C"}
                        </div>
                        <div>
                          <span className="font-medium text-white block">
                            {c.full_name || "Customer"}
                          </span>
                          <span className="text-[11px] text-gray-400 block font-mono">
                            ID: {c.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.email}</span>
                        {c.is_verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-gray-300">
                        {c.orders_count}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-white text-xs">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-plum-500/10 hover:bg-plum-500/20 text-plum-300 border border-plum-500/20 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ink border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Customer Profile
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {customerDetail?.email || "Loading..."}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {detailLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-plum-400" />
                </div>
              ) : customerDetail ? (
                <>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                    <div>
                      <span className="text-gray-400 block">Name:</span>
                      <span className="text-white font-medium">
                        {customerDetail.full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Lifetime Spend:</span>
                      <span className="text-plum-300 font-mono font-medium">
                        {formatCurrency(customerDetail.total_spent)}
                      </span>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-plum-400" /> Delivery Addresses (
                      {customerDetail.addresses.length})
                    </h4>
                    {customerDetail.addresses.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No saved addresses.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {customerDetail.addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
                          >
                            <span className="text-white font-medium block">
                              {addr.full_name} ({addr.label})
                            </span>
                            <span className="text-gray-400 block mt-0.5">
                              {addr.city}, {addr.region}
                            </span>
                            <span className="text-gray-400 block">{addr.phone_number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-plum-400" /> Recent Orders (
                      {customerDetail.recent_orders.length})
                    </h4>
                    {customerDetail.recent_orders.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No orders yet.</p>
                    ) : (
                      <div className="border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/[0.02] text-gray-400 border-b border-white/5">
                            <tr>
                              <th className="py-2 px-3">Order #</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3 text-right">Total</th>
                              <th className="py-2 px-3 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {customerDetail.recent_orders.map((o) => (
                              <tr key={o.id}>
                                <td className="py-2.5 px-3 font-mono text-plum-300">
                                  {o.order_number}
                                </td>
                                <td className="py-2.5 px-3 capitalize text-gray-300">
                                  {o.status}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-white">
                                  {formatCurrency(o.total)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-gray-400">
                                  {formatDate(o.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="px-6 py-3 border-t border-white/10 flex justify-end bg-white/[0.02]">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomersPage;
