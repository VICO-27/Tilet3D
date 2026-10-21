import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  RotateCw,
  Package,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

import adminApi from "../api/adminApi";
import type { AdminCategory, AdminProduct } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
import ProductModal from "../components/ProductModal";
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

export const AdminProductsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pageSize = 15;

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch {
      // non-fatal if categories fail to load
    }
  }, []);

  const fetchProducts = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      setError(null);
      setIsForbidden(false);

      try {
        const res = await adminApi.getProducts({
          page,
          search,
          category: selectedCategory,
          status: selectedStatus,
        });

        setProducts(res.results);
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
              "Failed to load product catalog."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, selectedCategory, selectedStatus]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, selectedCategory, selectedStatus, fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1);
  };

  const handleToggleActive = async (product: AdminProduct) => {
    setActionLoadingId(product.id);
    try {
      const res = await adminApi.toggleProductActive(product.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: res.is_active } : p))
      );
      setNotification({
        type: "success",
        text: res.message,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err?.response?.data?.detail || "Could not change product status.",
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const formatPrice = (priceVal?: string) => {
    if (!priceVal) return "ETB 0.00";
    const num = parseFloat(priceVal);
    if (isNaN(num)) return `ETB ${priceVal}`;
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
      title="Product Catalog"
      subtitle="Manage inventory, pricing, and showcase status"
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
                placeholder="Search by name, brand, SKU..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-ink border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
              >
                Search
              </button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchProducts(currentPage)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                title="Refresh product list"
              >
                <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white text-sm font-medium transition-all shadow-lg shadow-plum-900/40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-ink border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-plum-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-ink border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-plum-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(selectedCategory || selectedStatus || search) && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedStatus("");
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="text-xs text-plum-400 hover:text-plum-300 underline ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchProducts(currentPage)}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Products Table Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/[0.03] border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-4">Product Details</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Price</th>
                  <th scope="col" className="px-6 py-4">Inventory</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-sans">
                {/* Loading Skeleton */}
                {loading &&
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/10" />
                          <div className="space-y-2">
                            <div className="w-36 h-4 bg-white/10 rounded" />
                            <div className="w-20 h-3 bg-white/5 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-20 h-4 bg-white/10 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-4 bg-white/10 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-4 bg-white/10 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-6 bg-white/10 rounded-full" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="w-16 h-8 bg-white/10 rounded-xl ml-auto" />
                      </td>
                    </tr>
                  ))}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <Package className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-serif font-bold text-white mb-1">
                        No products found
                      </h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
                        {search || selectedCategory || selectedStatus
                          ? "No items match your active filter criteria. Try clearing filters or refining your query."
                          : "Your catalog is empty. Add your first cultural fashion product to start selling."}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-500 text-white text-xs font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Product
                      </button>
                    </td>
                  </tr>
                )}

                {/* Product Rows */}
                {!loading &&
                  products.map((item) => {
                    const isItemLoading = actionLoadingId === item.id;
                    const stock = item.total_stock;
                    const stockBadge =
                      stock === 0
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : stock <= 5
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Product Info & Media */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center group-hover:border-plum-500/40 transition-colors">
                              {item.primary_image ? (
                                <img
                                  src={item.primary_image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white truncate max-w-[220px]">
                                  {item.name}
                                </span>
                                {item.is_featured && (
                                  <span
                                    title="Featured Product"
                                    className="p-0.5 rounded text-amber-400 bg-amber-400/10"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                <span>{item.brand || "TILET3D"}</span>
                                {item.default_variant?.sku && (
                                  <>
                                    <span>•</span>
                                    <span>{item.default_variant.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 text-xs text-gray-300 font-medium">
                          {item.category?.name || "Uncategorized"}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-serif font-bold text-white text-sm">
                          {formatPrice(item.price)}
                        </td>

                        {/* Inventory */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${stockBadge}`}
                          >
                            <span>{stock} units</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              item.is_active
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-white/5 text-gray-400 border-white/10"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? "bg-emerald-400" : "bg-gray-500"
                              }`}
                            />
                            {item.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Edit product attributes"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleActive(item)}
                              disabled={isItemLoading}
                              className={`p-2 rounded-xl border transition-colors ${
                                item.is_active
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300"
                              }`}
                              title={item.is_active ? "Deactivate product" : "Reactivate product"}
                            >
                              <Power className={`w-3.5 h-3.5 ${isItemLoading ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && products.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
              <div>
                Showing{" "}
                <span className="font-medium text-white">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-white">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-medium text-white">{totalCount}</span>{" "}
                catalog products
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1 rounded-xl bg-ink border border-white/10 font-mono text-white text-[11px]">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchProducts(currentPage);
          setNotification({
            type: "success",
            text: editingProduct
              ? `Product '${editingProduct.name}' updated successfully.`
              : "New product created successfully.",
          });
          setTimeout(() => setNotification(null), 4000);
        }}
        product={editingProduct}
        categories={categories}
      />
    </AdminLayout>
  );
};

export default AdminProductsPage;
