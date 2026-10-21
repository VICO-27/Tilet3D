import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  RotateCw,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { useAuthStore } from "@/app/store/useAuthStore";
import adminApi from "../api/adminApi";
import type { AdminOverviewResponse } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
import MetricCard from "../components/MetricCard";
import AccessDenied from "../components/AccessDenied";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const AdminOverviewPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const result = await adminApi.getOverview();
      setData(result);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      if (axiosErr?.response?.status === 403) {
        setIsForbidden(true);
      } else {
        const msg =
          axiosErr?.response?.data?.detail ||
          axiosErr?.message ||
          "Failed to load operational metrics.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // 1. HTTP 403 Forbidden: Render Access Denied
  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  // 2. Unauthenticated check (no stored user / token)
  if (!user && !loading && !data) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-plum-500/10 border border-plum-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-plum-300">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Please log in with an authorized staff account to access the administration portal.
          </p>
          <Link
            to="/login?redirect=/admin"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white font-medium text-sm transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // 3. Sub-section Placeholder (for planned sections like /admin/products, /admin/orders, etc.)
  if (section && section !== "overview") {
    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
    return (
      <AdminLayout
        title={`${sectionTitle} Management`}
        subtitle="Planned Phase 3 Feature"
      >
        <div className="max-w-3xl mx-auto py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-plum-500/10 border border-plum-500/20 flex items-center justify-center mx-auto mb-6 text-plum-300">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-plum-500/10 text-plum-300 border border-plum-500/20 mb-3">
            Phase 3 • Scheduled Implementation
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
            {sectionTitle} Management Module
          </h2>

          <p className="text-gray-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            This module is reserved for Phase 3 (catalog curation, order lifecycle mutations, and inventory management).
            Live telemetry and operational statistics remain active on the Overview dashboard.
          </p>

          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white font-medium text-sm transition-all shadow-lg shadow-plum-900/40"
          >
            Return to Overview Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Helper for ETB currency formatting
  const formatCurrency = (val?: string) => {
    if (!val) return "ETB 0.00";
    const num = parseFloat(val);
    if (isNaN(num)) return `ETB ${val}`;
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Operational telemetry & aggregate metrics"
    >
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h2 className="text-xl font-serif font-bold text-white">
              Executive Overview
            </h2>
            <p className="text-xs text-gray-400">
              Zero PII aggregate telemetry from production data models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-gray-500 font-mono hidden md:inline">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchOverview}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white/5 border border-white/10 animate-pulse p-6"
              />
            ))}
          </div>
        )}

        {/* Success Metrics Grid */}
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Revenue (Paid)"
                value={formatCurrency(data.metrics.total_revenue)}
                subtitle={`${data.metrics.paid_orders} paid orders processed`}
                icon={DollarSign}
                badge={{ text: "Verified", variant: "success" }}
              />

              <MetricCard
                title="Total Orders"
                value={data.metrics.total_orders}
                subtitle={`${data.metrics.pending_orders} awaiting completion`}
                icon={ShoppingBag}
                badge={{
                  text: `${data.metrics.pending_orders} Pending`,
                  variant: data.metrics.pending_orders > 0 ? "warning" : "neutral",
                }}
              />

              <MetricCard
                title="Catalog Products"
                value={data.metrics.total_products}
                subtitle={`${data.metrics.active_products} active in storefront`}
                icon={Package}
                badge={{
                  text: `${data.metrics.active_products} Active`,
                  variant: "plum",
                }}
              />

              <MetricCard
                title="Total Customers"
                value={data.metrics.total_customers}
                subtitle="Registered customer accounts"
                icon={Users}
                badge={{ text: "Aggregate", variant: "neutral" }}
              />
            </div>

            {/* Inventory Alerts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Low Stock Alert (≤ 5 units)"
                value={data.metrics.low_stock_variants}
                subtitle="Variants requiring replenishment"
                icon={AlertTriangle}
                badge={{
                  text:
                    data.metrics.low_stock_variants > 0
                      ? "Attention Required"
                      : "Healthy",
                  variant:
                    data.metrics.low_stock_variants > 0 ? "warning" : "success",
                }}
              />

              <MetricCard
                title="Out of Stock Variants"
                value={data.metrics.out_of_stock_variants}
                subtitle="Variants with zero physical inventory"
                icon={Package}
                badge={{
                  text:
                    data.metrics.out_of_stock_variants > 0
                      ? "Action Needed"
                      : "None",
                  variant:
                    data.metrics.out_of_stock_variants > 0 ? "warning" : "success",
                }}
              />
            </div>

            {/* Order Pipeline Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-base font-serif font-bold text-white">
                  Order Status Pipeline
                </h3>
                <p className="text-xs text-gray-400">
                  Distribution of customer orders across lifecycle states
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-amber-400 mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.pending}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Pending
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-blue-400 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.confirmed}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Confirmed
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-plum-400 mb-2">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.processing}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Processing
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-cyan-400 mb-2">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.shipped}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Shipped
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-emerald-400 mb-2">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.delivered}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Delivered
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="flex items-center justify-center text-rose-400 mb-2">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-white">
                    {data.orders_by_status.cancelled}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                    Cancelled
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps / Phase 3 Roadmap Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-plum-950/40 via-white/5 to-white/[0.02] border border-plum-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-plum-500/20 text-plum-300 border border-plum-500/30">
                  Phase 2B Admin Foundation Established
                </span>
                <h4 className="text-base font-serif font-bold text-white mt-2">
                  Ready for Phase 3 Module Implementation
                </h4>
                <p className="text-xs text-gray-400 max-w-xl mt-1">
                  Server-enforced staff authorization and live operational telemetry are securely connected. Product management, order fulfillment mutations, and inventory controls will be wired in Phase 3.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/products"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  View Planned Modules
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOverviewPage;
