import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Ban,
  ArrowUpRight,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminPaymentItem } from "../types/admin";
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

export const AdminPaymentsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const pageSize = 15;

  const fetchPayments = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getPayments({
          page,
          search,
          status: selectedStatus,
        });
        setPayments(res.results);
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
              "Failed to load payments audit log."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, selectedStatus]
  );

  useEffect(() => {
    fetchPayments(currentPage);
  }, [fetchPayments, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments(1);
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          icon: CheckCircle2,
          label: "Success",
        };
      case "pending":
      case "initiated":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          icon: Clock,
          label: status,
        };
      case "failed":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          icon: AlertCircle,
          label: "Failed",
        };
      case "cancelled":
        return {
          bg: "bg-neutral-500/10 border-neutral-500/30 text-neutral-300",
          icon: Ban,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-white/5 border-white/10 text-gray-300",
          icon: Clock,
          label: status,
        };
    }
  };

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Payment Transactions"
      subtitle="Read-only audit record of Chapa payment verifications and gateway webhooks"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Protection Banner */}
        <div className="p-4 rounded-xl bg-plum-500/[0.04] border border-plum-500/20 text-xs flex items-center gap-3 text-gray-300">
          <Shield className="w-5 h-5 text-plum-400 shrink-0" />
          <div>
            <span className="font-semibold text-white block">
              Cryptographic Payment Verification Active
            </span>
            <span>
              All transactions are strictly reconciled against Chapa's servers. Manual editing of payment status or browser-initiated status spoofing is mathematically prohibited.
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, or transaction ID..."
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
              onClick={() => fetchPayments(currentPage)}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            {[
              { id: "", label: "All Records" },
              { id: "success", label: "Success" },
              { id: "pending", label: "Pending" },
              { id: "initiated", label: "Initiated" },
              { id: "failed", label: "Failed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedStatus(f.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  selectedStatus === f.id
                    ? "bg-plum-600/30 border-plum-500 text-plum-200 font-medium"
                    : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchPayments(currentPage)}
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
                <th className="py-3.5 px-4 sm:px-6">Order Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Txn / Ref</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                      <span className="text-xs">Loading payment logs...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">
                        No payment records found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const badge = getStatusBadge(p.status);
                  const Icon = badge.icon;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono text-xs font-semibold text-plum-300">
                        {p.order_number}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        {p.user_email}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-white uppercase">
                        {p.provider}
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-400">
                        {p.transaction_id || p.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-medium text-white text-xs whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${badge.bg}`}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;
