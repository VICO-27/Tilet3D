import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, User, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import axios from "axios";
import apiClient from "../../../shared/api/apiClient";
import { useCartStore } from "../../../app/store/useCartStore";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

interface AddressItem {
  is_default?: boolean;
  full_name?: string;
  phone?: string;
  region?: string;
  city?: string;
  sub_city?: string;
  woreda?: string;
  house_no?: string;
  postal_code?: string;
}

export const CheckoutModal = ({ isOpen, onClose, onSuccess }: CheckoutModalProps) => {
  const { cartTotal, fetchCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    region: "",
    city: "",
    sub_city: "",
    woreda: "",
    house_no: "",
    postal_code: "",
    note: "",
    provider: "chapa",
  });

  useEffect(() => {
    if (isOpen) {
      const fetchUserData = async () => {
        try {
          const [profileRes, addressesRes] = await Promise.allSettled([
            apiClient.get("/auth/profile/"),
            apiClient.get("/auth/addresses/")
          ]);

          let name = "";
          let phone = "";

          if (profileRes.status === "fulfilled" && profileRes.value.data) {
            const p = profileRes.value.data;
            name = p.full_name || p.name || "";
            phone = p.phone || "";
          }

          if (addressesRes.status === "fulfilled" && addressesRes.value.data) {
            const rawData = addressesRes.value.data;
            const addresses: AddressItem[] = Array.isArray(rawData) ? rawData : (rawData.results || []);
            const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];

            if (defaultAddress) {
              setFormData((prev) => ({
                ...prev,
                full_name: name || defaultAddress.full_name || "",
                phone: phone || defaultAddress.phone || "",
                region: defaultAddress.region || "Oromia",
                city: defaultAddress.city || "Adama",
                sub_city: defaultAddress.sub_city || "",
                woreda: defaultAddress.woreda || "",
                house_no: defaultAddress.house_no || "",
                postal_code: defaultAddress.postal_code || "",
              }));
              return;
            }
          }

          setFormData((prev) => ({ ...prev, full_name: name, phone: phone, region: "Oromia", city: "Adama" }));
        } catch (err) {
          console.error("Could not pre-fill user profile details", err);
        }
      };

      fetchUserData();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/orders/checkout/", formData);
      const { order_id, checkout_url } = response.data;

      await fetchCart();

      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        onSuccess(order_id);
      }
    } catch (err: unknown) {
      console.error("Checkout failed", err);
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as { message?: string };
        setError(errorData?.message || "Failed to initialize checkout. Please check your delivery details.");
      } else {
        setError("An unexpected error occurred during checkout.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Costs Calculation ---
  const subtotal = cartTotal();
  const tax = subtotal * 0.15;

  // Simple frontend mirror of the backend logic
  const getShippingFee = (region: string, city: string) => {
    const c = (city || "").toLowerCase().trim();
    if (c === 'adama') return 150;
    if (c === 'addis ababa') return 300;
    return 500; // default
  };

  const shipping = getShippingFee(formData.region, formData.city);
  const grandTotal = subtotal + tax + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-stone-100 z-10 overflow-hidden my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100 bg-stone-50/50">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure Encryption
                </div>
                <h2 className="font-serif text-2xl font-normal text-stone-900 tracking-tight">Express Checkout</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-900 transition-colors"
                aria-label="Close checkout"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mx-8 mt-6 rounded-2xl bg-rose-50 p-4 text-xs font-medium text-rose-600 border border-rose-100">
                {error}
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Section 1: Contact Information */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">1. Contact & Recipient</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Ashenafi Deresa"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-11 pr-4 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+251 900 343 71"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-11 pr-4 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Location */}
              <div className="space-y-4 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">2. Delivery Address</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        name="region"
                        required
                        value={formData.region}
                        onChange={handleChange}
                        placeholder="Oromia"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-11 pr-4 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Adama"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Sub City</label>
                    <input
                      type="text"
                      name="sub_city"
                      value={formData.sub_city}
                      onChange={handleChange}
                      placeholder="Bole"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-3.5 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Woreda</label>
                    <input
                      type="text"
                      name="woreda"
                      value={formData.woreda}
                      onChange={handleChange}
                      placeholder="03"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-3.5 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1.5">House No.</label>
                    <input
                      type="text"
                      name="house_no"
                      value={formData.house_no}
                      onChange={handleChange}
                      placeholder="445"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-3.5 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1.5">Delivery Note (Optional)</label>
                  <textarea
                    name="note"
                    rows={2}
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Gate code, landmark, or specific tailor notes..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 p-4 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Receipt Summary & Payment Action Footer */}
              <div className="pt-6 border-t border-stone-100 bg-white sticky bottom-0 space-y-4 pb-2">
                <div className="space-y-3 px-1">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Subtotal</span>
                    <span>ETB {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Tax (15% VAT)</span>
                    <span>ETB {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Shipping ({formData.city || "Pending"})</span>
                    <span>ETB {shipping.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dashed border-stone-200">
                  <div className="w-full sm:w-auto text-left flex flex-col justify-center">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400">Total Due</p>
                    <p className="font-serif text-2xl font-bold text-stone-900">
                      ETB {grandTotal.toLocaleString()}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-stone-900 px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-violet-600 transition-all shadow-xl shadow-stone-900/10 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay with Chapa <CreditCard className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};