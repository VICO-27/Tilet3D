import React, { useState, useEffect, useCallback } from "react";
import {
  Warehouse,
  Search,
  Filter,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Edit3,
  ShieldAlert,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminInventoryVariant } from "../types/admin";
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

export const AdminInventoryPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [items, setItems] = useState<AdminInventoryVariant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Adjustment Modal
  const [editingVariant, setEditingVariant] = useState<AdminInventoryVariant | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchInventory = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getInventory({
          page,
          search,
          status: selectedStatus,
        });
        setItems(res.results);
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
              "Failed to load inventory stock."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, selectedStatus]
  );

  useEffect(() => {
    fetchInventory(currentPage);
  }, [fetchInventory, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInventory(1);
  };

  const handleOpenAdjust = (variant: AdminInventoryVariant) => {
    setEditingVariant(variant);
    setNewStock(variant.stock);
    setAdjustReason("");
    setModalError(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    if (newStock < editingVariant.reserved_stock) {
      setModalError(
        `Cannot set stock to ${newStock}. There are currently ${editingVariant.reserved_stock} units reserved for active checkouts/orders.`
      );
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const res = await adminApi.adjustInventoryStock(
        editingVariant.id,
        newStock,
        adjustReason
      );
      setItems((prev) =>
        prev.map((v) => (v.id === editingVariant.id ? res.variant : v))
      );
      setNotification({
        type: "success",
        text: res.message,
      });
      setTimeout(() => setNotification(null), 4000);
      setEditingVariant(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setModalError(
        axiosErr?.response?.data?.detail || "Failed to update stock quantity."
      );
    } finally {
      setSubmitting(false);
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

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Inventory Oversight"
      subtitle="SKU-level stock tracking, checkout reservations, and safe physical adjustments"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
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

        {/* Toolbar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, product name, or variant..."
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
              onClick={() => fetchInventory(currentPage)}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Stock:
            </span>
            {[
              { id: "", label: "All Items" },
              { id: "in_stock", label: "In Stock (> 5)" },
              { id: "low_stock", label: "Low Stock (1-5)" },
              { id: "out_of_stock", label: "Out of Stock (0)" },
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
              onClick={() => fetchInventory(currentPage)}
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
                <th className="py-3.5 px-4 sm:px-6">Garment / Variant</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-center">Physical Stock</th>
                <th className="py-3.5 px-4 text-center">Reserved</th>
                <th className="py-3.5 px-4 text-center">Available</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                      <span className="text-xs">Loading inventory records...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Warehouse className="w-8 h-8 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">
                        No inventory items found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isOutOfStock = item.available_stock === 0;
                  const isLowStock = item.available_stock > 0 && item.available_stock <= 5;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div>
                          <span className="font-medium text-white block">
                            {item.product_name}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            {item.name}{" "}
                            {[item.color, item.size].filter(Boolean).length > 0 &&
                              `(${[item.color, item.size].filter(Boolean).join(" / ")})`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-400">
                        {item.sku}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-white text-xs">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-medium text-white">
                        {item.stock}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-amber-300">
                        {item.reserved_stock > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                            {item.reserved_stock}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">0</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                            isOutOfStock
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                              : isLowStock
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {isOutOfStock ? (
                            "0 (Out)"
                          ) : isLowStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {item.available_stock} (Low)
                            </>
                          ) : (
                            item.available_stock
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ink border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Adjust Stock Quantity
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingVariant.product_name} • {editingVariant.sku}
                </p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Current Stock:</span>
                  <span className="text-white font-mono font-medium text-sm">
                    {editingVariant.stock} units
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Committed (Reserved):</span>
                  <span className="text-amber-300 font-mono font-medium text-sm">
                    {editingVariant.reserved_stock} units
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  New Physical Inventory Stock <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={editingVariant.reserved_stock}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-plum-500"
                />
                <p className="text-[11px] text-gray-500">
                  Must be at least {editingVariant.reserved_stock} to honor in-flight checkouts.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Warehouse restock, recount, supplier shipment"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInventoryPage;
