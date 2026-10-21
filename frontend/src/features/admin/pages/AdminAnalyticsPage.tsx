import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  RotateCw,
  AlertCircle,
  Warehouse,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminAnalyticsResponse } from "../types/admin";
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

export const AdminAnalyticsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const res = await adminApi.getAnalytics();
      setData(res);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      if (axiosErr?.response?.status === 403) {
        setIsForbidden(true);
      } else {
        setError(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            "Failed to calculate store analytics."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Store Analytics"
      subtitle="Real financial performance, inventory health, and cultural garment popularity"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Action */}
        <div className="flex justify-end">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RotateCw className="w-8 h-8 text-plum-400 animate-spin" />
            <p className="text-sm text-gray-400">Aggregating database telemetry...</p>
          </div>
        ) : data ? (
          <>
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">
                    Total Paid Revenue
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-white font-mono">
                  {formatCurrency(data.financials.total_revenue)}
                </div>
                <span className="text-[11px] text-gray-500">
                  From {data.financials.paid_orders_count} verified paid orders
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">
                    Average Order Value
                  </span>
                  <div className="p-2 rounded-xl bg-plum-500/10 text-plum-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-white font-mono">
                  {formatCurrency(data.financials.average_order_value)}
                </div>
                <span className="text-[11px] text-gray-500">
                  Calculated per completed checkout
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">
                    Active Catalog Variants
                  </span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Warehouse className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-white font-mono">
                  {data.inventory_health.total_variants}
                </div>
                <span className="text-[11px] text-gray-500">
                  {data.inventory_health.low_stock} low stock • {data.inventory_health.out_of_stock} out of stock
                </span>
              </div>
            </div>

            {/* Orders Breakdown & Top Garments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-plum-400" />
                  Order Fulfillment Funnel
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.orders_by_status).map(([status, count]) => (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize text-gray-300">{status}</span>
                        <span className="font-mono text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === "delivered"
                              ? "bg-emerald-500"
                              : status === "shipped"
                              ? "bg-sky-500"
                              : status === "processing"
                              ? "bg-purple-500"
                              : status === "confirmed"
                              ? "bg-blue-500"
                              : status === "pending"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, (count / (data.financials.paid_orders_count || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-plum-400" />
                  Top Selling Cultural Garments
                </h3>
                {data.top_products.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-6 text-center">
                    No completed sales data recorded yet.
                  </p>
                ) : (
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.02] text-gray-400 border-b border-white/5">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-center">Units Sold</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {data.top_products.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3 font-medium text-white">
                              {p.product_name}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-medium text-white">
                              {p.units_sold}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-plum-300 font-medium">
                              {formatCurrency(p.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
