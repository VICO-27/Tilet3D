import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Sparkles,
  ShieldCheck,
  Truck,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { rentalApi } from '../api/rentalApi';
import {
  RentalProductConfig,
  PricingMode,
  FulfillmentMethod,
  RentalQuoteResponse,
} from '../types';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface RentalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    brand?: string;
    price?: number | string;
    variants?: Array<{ id: string; size?: string; color?: string; name?: string; price?: any }>;
    media?: Array<{ file: string; media_type?: string }>;
  };
}

export const RentalBookingModal: React.FC<RentalBookingModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [rentalConfig, setRentalConfig] = useState<RentalProductConfig | null>(null);

  // Form State
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [pricingMode, setPricingMode] = useState<PricingMode>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  
  // Tomorrow as default start date
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4); // 3 days later
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('shop_pickup');
  const [quantity, setQuantity] = useState<number>(1);

  // Contact details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('');
  const [city, setCity] = useState<string>('Addis Ababa');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Quote & Availability State
  const [quote, setQuote] = useState<RentalQuoteResponse | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [availability, setAvailability] = useState<{
    is_available: boolean;
    available_count: number;
    message: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch product rental config on open
  useEffect(() => {
    if (!isOpen || !product?.id) return;

    let isMounted = true;
    setLoadingConfig(true);
    setErrorMsg('');

    rentalApi
      .getProductRentalConfig(product.id)
      .then((cfg) => {
        if (!isMounted) return;
        setRentalConfig(cfg);
        if (cfg.packages?.length > 0) {
          setSelectedPackageId(cfg.packages[0].id);
          setPricingMode('package');
        } else {
          setPricingMode('flexible_daily');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg('Failed to load rental options for this piece.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product.id]);

  // Set default full name from logged-in user if available
  useEffect(() => {
    if (user && !fullName) {
      const name = (user as any)?.full_name || (user as any)?.email || '';
      setFullName(name);
    }
  }, [user, fullName]);

  // Recalculate quote & verify availability whenever choices change
  useEffect(() => {
    if (!rentalConfig || !rentalConfig.is_rental_enabled) return;

    let active = true;
    setIsQuoting(true);

    const payload = {
      product_id: product.id,
      variant_id: selectedVariantId || null,
      pricing_mode: pricingMode,
      start_date: startDate,
      end_date: pricingMode === 'flexible_daily' ? endDate : null,
      package_id: pricingMode === 'package' ? selectedPackageId : null,
      quantity,
      fulfillment_method: fulfillmentMethod,
    };

    rentalApi
      .getQuote(payload)
      .then((q) => {
        if (!active) return;
        setQuote(q);
        setErrorMsg('');

        // Also check availability for resolved start & end dates
        rentalApi
          .checkAvailability(
            product.id,
            q.start_date,
            q.end_date,
            selectedVariantId || null,
            quantity
          )
          .then((avail) => {
            if (active) setAvailability(avail);
          })
          .catch(() => {});
      })
      .catch((err: any) => {
        if (!active) return;
        const msg = err.response?.data?.error || err.message || 'Error calculating quote.';
        setErrorMsg(msg);
        setQuote(null);
      })
      .finally(() => {
        if (active) setIsQuoting(false);
      });

    return () => {
      active = false;
    };
  }, [
    rentalConfig,
    product.id,
    selectedVariantId,
    pricingMode,
    selectedPackageId,
    startDate,
    endDate,
    quantity,
    fulfillmentMethod,
  ]);

  const primaryImage = useMemo(() => {
    return product.media?.[0]?.file || '/placeholder-dress.jpg';
  }, [product]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onClose();
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Please accept the rental care terms and conditions to proceed.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please provide a valid phone number for handover and return coordination.');
      return;
    }

    if (fulfillmentMethod === 'delivery' && !addressLine.trim()) {
      setErrorMsg('Please enter your delivery address in Addis Ababa.');
      return;
    }

    if (availability && !availability.is_available) {
      setErrorMsg(availability.message || 'Selected dates are not available.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await rentalApi.createBooking({
        product_id: product.id,
        variant_id: selectedVariantId || null,
        pricing_mode: pricingMode,
        start_date: startDate,
        end_date: pricingMode === 'flexible_daily' ? endDate : null,
        package_id: pricingMode === 'package' ? selectedPackageId : null,
        quantity,
        fulfillment_method: fulfillmentMethod,
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line: addressLine.trim(),
        city: city.trim(),
      });

      if (res.checkout_url) {
        // Redirect customer to Chapa official secure payment page
        window.location.href = res.checkout_url;
      } else {
        // Fallback to orders/rentals page
        navigate(`/orders?tab=rentals&booking_id=${res.booking_id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to initialize rental booking.';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-purple-500/20 text-zinc-100 rounded-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header Banner */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-zinc-900 via-purple-950/40 to-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-purple-400">
                  Tilet Atelier Rental
                </span>
                <h2 className="text-xl font-serif text-white">{product.name}</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingConfig ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-xs uppercase tracking-widest font-mono">Loading atelier rental terms...</p>
            </div>
          ) : rentalConfig && !rentalConfig.is_rental_enabled ? (
            <div className="p-8 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-purple-400 mx-auto" />
              <h3 className="text-lg font-serif text-white">Rental Currently Unavailable</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                This artisanal piece is currently not available for rental. You can still purchase this garment directly.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Product Preview Card */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-16 h-20 object-cover rounded-xl border border-white/10"
                />
                <div className="flex-1">
                  <span className="text-[10px] text-purple-400/90 uppercase tracking-widest font-semibold">
                    {product.brand || 'Tilet3D Atelier'}
                  </span>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Daily Rate: <span className="text-zinc-200 font-bold">{rentalConfig?.daily_rate} ETB</span>
                    {' · '}
                    Deposit: <span className="text-purple-300 font-bold">{rentalConfig?.security_deposit} ETB</span>
                  </p>
                </div>
              </div>

              {/* Variant / Size Selection */}
              {product.variants && product.variants.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Select Size / Variant
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedVariantId === v.id
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:border-purple-500/40'
                        }`}
                      >
                        {v.size || v.color || v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Mode Toggle: Fixed Package vs Custom Dates */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Rental Duration Options
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPricingMode('package')}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                      pricingMode === 'package'
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Fixed Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('flexible_daily')}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                      pricingMode === 'flexible_daily'
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Custom Dates
                  </button>
                </div>
              </div>

              {/* Fixed Package Selection */}
              {pricingMode === 'package' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Choose Curated Rental Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {rentalConfig?.packages?.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{pkg.name}</span>
                            <span className="text-[11px] font-mono font-bold text-purple-400">
                              {pkg.price} ETB
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            {pkg.duration_days} Days Full Access
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Event / Pickup Start Date
                    </label>
                    <input
                      type="date"
                      min={defaultStartDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Flexible Date Picker */}
              {pricingMode === 'flexible_daily' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Pickup / Event Date
                    </label>
                    <input
                      type="date"
                      min={defaultStartDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={startDate || defaultStartDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Availability Status Badge */}
              {availability && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
                    availability.is_available
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/40 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {availability.is_available ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {availability.is_available
                      ? `Garment Available (${availability.available_count} in atelier stock for these dates)`
                      : availability.message}
                  </span>
                </div>
              )}

              {/* Fulfillment Method Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Fulfillment & Return Handover
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setFulfillmentMethod('shop_pickup')}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      fulfillmentMethod === 'shop_pickup'
                        ? 'bg-purple-500/10 border-purple-500 text-white'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Building2 className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Atelier Pickup & Return</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Free · Bole Medhanialem, Addis Ababa</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFulfillmentMethod('delivery')}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      fulfillmentMethod === 'delivery'
                        ? 'bg-purple-500/10 border-purple-500 text-white'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Truck className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">White-Glove Courier</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        +{rentalConfig?.delivery_fee} ETB · Doorstep Drop & Collection
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Handover Details */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+251 91 234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Delivery Address (Addis Ababa) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bole Sub-city, Woreda 03, House 412"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Transparent Financial Quote Breakdown */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Rental Duration ({quote?.duration_days || 0} days)
                  </span>
                  <span className="font-mono font-medium text-white">
                    {quote?.rental_subtotal ?? '—'} ETB
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span>Refundable Security Deposit</span>
                    <Info className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <span className="font-mono font-medium text-purple-400">
                    +{quote?.deposit_amount ?? '—'} ETB
                  </span>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">2-Way Doorstep Delivery & Return</span>
                    <span className="font-mono font-medium text-white">
                      +{quote?.delivery_fee ?? '—'} ETB
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                      Total Payable Today
                    </p>
                    <p className="text-[10px] text-purple-400/80">
                      * Deposit of {quote?.deposit_amount} ETB refunded upon return inspection
                    </p>
                  </div>
                  <span className="text-xl font-mono font-bold text-white">
                    {quote?.total_amount ?? '—'} ETB
                  </span>
                </div>
              </div>

              {/* Terms Acceptance */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <span className="text-[11px] leading-relaxed text-zinc-400">
                  I agree to the Tilet3D Rental & Cultural Garment Care Policy. Traditional Ethiopian fabrics
                  require gentle handling. The security deposit will be automatically cleared upon standard atelier inspection.
                </span>
              </label>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit / Checkout Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isQuoting || Boolean(availability && !availability.is_available)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full shadow-2xl hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-purple-900/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Securing Reservation & Connecting Chapa...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Reserve & Pay with Chapa ({quote?.total_amount || 0} ETB)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-zinc-500 mt-2">
                  🔒 Safe, 256-bit encrypted payment powered by Chapa. Ethiopian Birr (ETB).
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RentalBookingModal;
