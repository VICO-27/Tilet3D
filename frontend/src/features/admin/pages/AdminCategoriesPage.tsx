import React, { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Search,
  Plus,
  RotateCw,
  Folder,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Power,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminCategoryDetail } from "../types/admin";
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

export const AdminCategoriesPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [categories, setCategories] = useState<AdminCategoryDetail[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const data = await adminApi.getCategoriesDetail();
      setCategories(data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      if (axiosErr?.response?.status === 403) {
        setIsForbidden(true);
      } else {
        setError(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            "Failed to load categories catalog."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    setModalError(null);

    try {
      await adminApi.createCategory({
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setIsModalOpen(false);
      setNewName("");
      setNewDesc("");
      setNotification({
        type: "success",
        text: `Category '${newName}' created successfully.`,
      });
      setTimeout(() => setNotification(null), 4000);
      fetchCategories();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setModalError(
        axiosErr?.response?.data?.detail || "Failed to create category."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategoryDetail) => {
    try {
      const updated = await adminApi.updateCategory(cat.id, {
        is_active: !cat.is_active,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: updated.is_active } : c))
      );
      setNotification({
        type: "success",
        text: `Category '${cat.name}' is now ${
          updated.is_active ? "active" : "hidden"
        }.`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification({
        type: "error",
        text: `Could not update category status.`,
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="Categories & Collections"
      subtitle="Organize luxury Ethiopian cultural garments and catalog taxonomies"
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-plum-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchCategories}
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
                <th className="py-3.5 px-4 sm:px-6">Category</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4 text-center">Assigned Products</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RotateCw className="w-6 h-6 text-plum-400 animate-spin" />
                      <span className="text-xs">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Folder className="w-8 h-8 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">
                        No categories found
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-plum-500/10 border border-plum-500/20 text-plum-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-white block">{c.name}</span>
                          {c.description && (
                            <span className="text-xs text-gray-400 block line-clamp-1">
                              {c.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-gray-400">
                      {c.slug}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-gray-300">
                        {c.product_count} products
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          c.is_active
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                        }`}
                      >
                        {c.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.is_active ? "Hide category" : "Activate category"}
                        className={`p-2 rounded-xl border transition-colors ${
                          c.is_active
                            ? "bg-emerald-500/10 hover:bg-rose-500/15 border-emerald-500/30 hover:border-rose-500/30 text-emerald-400 hover:text-rose-300"
                            : "bg-white/5 hover:bg-emerald-500/15 border-white/10 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-300"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ink border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-base font-serif font-bold text-white">
                Add New Category
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Modern Habesha Kemis"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description for storefront display..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
