import React, { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminCategory, AdminProduct } from "../types/admin";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: AdminProduct | null;
  categories: AdminCategory[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}) => {
  const isEdit = Boolean(product);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("TILET3D");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [sku, setSku] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategoryId(product.category?.id || (categories[0]?.id ?? ""));
      setDescription(product.description || "");
      setBrand(product.brand || "TILET3D");
      setPrice(product.price || "");
      setStock(product.default_variant ? String(product.default_variant.stock) : "10");
      setSku(product.default_variant?.sku || "");
      setColor(product.default_variant?.color || "");
      setSize(product.default_variant?.size || "");
      setIsActive(product.is_active ?? true);
      setIsFeatured(product.is_featured ?? false);
      setImageFile(null);
      setImageUrl("");
      setImagePreview(product.primary_image || null);
    } else {
      setName("");
      setCategoryId(categories[0]?.id || "");
      setDescription("");
      setBrand("TILET3D");
      setPrice("");
      setStock("10");
      setSku("");
      setColor("");
      setSize("");
      setIsActive(true);
      setIsFeatured(false);
      setImageFile(null);
      setImageUrl("");
      setImagePreview(null);
    }
    setError(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (val: string) => {
    setImageUrl(val);
    if (val.trim()) {
      setImageFile(null);
      setImagePreview(val.trim());
    } else if (!product?.primary_image) {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Product name is required.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Price must be a valid number greater than 0.");
      return;
    }

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setError("Stock must be a non-negative integer (0 or higher).");
      return;
    }

    setLoading(true);

    try {
      const payloadData: Record<string, unknown> = {
        name: cleanName,
        category_id: categoryId,
        description: description.trim(),
        brand: brand.trim() || "TILET3D",
        price: numPrice.toFixed(2),
        stock: numStock,
        color: color.trim(),
        size: size.trim(),
        is_active: isActive,
        is_featured: isFeatured,
      };

      if (sku.trim()) {
        payloadData.sku = sku.trim().toUpperCase();
      }

      if (imageFile) {
        // Send as FormData for multipart upload
        const formData = new FormData();
        Object.entries(payloadData).forEach(([k, v]) => {
          formData.append(k, String(v));
        });
        formData.append("image_file", imageFile);

        if (isEdit && product) {
          await adminApi.updateProduct(product.id, formData);
        } else {
          await adminApi.createProduct(formData);
        }
      } else {
        if (imageUrl.trim()) {
          payloadData.image_url = imageUrl.trim();
        }

        if (isEdit && product) {
          await adminApi.updateProduct(product.id, payloadData);
        } else {
          await adminApi.createProduct(payloadData as any);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const resData = err?.response?.data;
      if (typeof resData === "string") {
        setError(resData);
      } else if (resData && typeof resData === "object") {
        // Format DRF field errors
        const messages = Object.entries(resData).map(
          ([key, val]) => `${key}: ${Array.isArray(val) ? val.join(" ") : String(val)}`
        );
        setError(messages.join(" | ") || "Failed to save product.");
      } else {
        setError(err?.message || "Failed to save product.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111116] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-serif font-bold text-white">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-gray-400">
              {isEdit
                ? `Updating '${product?.name}' catalog attributes`
                : "Create a new catalog product with initial variant and pricing"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-gray-300">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Gold Embroidered Kemis"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-white/10 text-white text-sm focus:outline-none focus:border-plum-500 transition-colors"
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="TILET3D"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
              />
            </div>
          </div>

          {/* Pricing & Initial Variant */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-plum-300">
              Primary Variant & Pricing
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Price (ETB) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3500.00"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-plum-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Stock Units <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-plum-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  SKU <span className="text-gray-500">(Auto if blank)</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="TLT-KMS-01"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Gold / White"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Bespoke / Custom / M"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of craftsmanship, weaving, and materials..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-plum-500 transition-colors resize-none"
            />
          </div>

          {/* Media / Image */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-plum-300">
              Primary Product Media
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Image Preview */}
              <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-plum-400" />
                  <span>Choose Image File (Cloudinary)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">
                    OR PATH/URL
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="tilet3d/products/media/kemis_gold.jpg or URL"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-plum-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-plum-600 rounded bg-ink border-white/20 focus:ring-plum-500 focus:ring-offset-ink"
              />
              <div>
                <span className="text-xs font-medium text-white block">
                  Active in Store
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Visible to buyers
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-plum-600 rounded bg-ink border-white/20 focus:ring-plum-500 focus:ring-offset-ink"
              />
              <div>
                <span className="text-xs font-medium text-white block">
                  Featured Product
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Homepage hero showcase
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-500 text-white font-medium text-xs transition-all shadow-lg shadow-plum-900/40 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
