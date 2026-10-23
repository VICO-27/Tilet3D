import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Lock,
  Building2,
  Truck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { rentalApi } from '../api/rentalApi';
import type {
  RentalProductConfig,
  RentalQuoteResponse,
  PricingMode,
  FulfillmentMethod,
  RentalPackage,
  RentalBookingCreatePayload,
} from '../types';
import { useAuthStore } from '@/app/store/useAuthStore';

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
  const { t } = useTranslation();
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
  const [quantity] = useState<number>(1);

  // Contact details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('');
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

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      .catch((err: any) => {
        if (isMounted) {
          const is404 = err.response?.status === 404;
          setErrorMsg(
            is404
              ? 'Rental service is currently synchronizing with the cloud backend.'
              : 'Failed to load rental options for this piece.'
          );
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
    startDate,
    endDate,
    selectedPackageId,
    quantity,
    fulfillmentMethod,
  ]);

  const primaryImage =
    product.media?.[0]?.file ||
    '/static/images/placeholder-garment.jpg';

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setErrorMsg(t("rentals.agreePrompt", "Please agree to the Cultural Garment Care Policy to continue."));
      return;
    }

    if (!isAuthenticated) {
      onClose();
      navigate('/account');
      return;
    }

    if (fulfillmentMethod === 'delivery' && !addressLine.trim()) {
      setErrorMsg(t("checkout.addressRequired", "Delivery address is required for white-glove courier fulfillment."));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: RentalBookingCreatePayload = {
        product_id: product.id,
        variant_id: selectedVariantId || null,
        pricing_mode: pricingMode,
        start_date: quote?.start_date || startDate,
        end_date: quote?.end_date || endDate,
        package_id: pricingMode === 'package' ? selectedPackageId : null,
        quantity,
        fulfillment_method: fulfillmentMethod,
        full_name: fullName,
        phone: phone,
        address_line: fulfillmentMethod === 'delivery' ? addressLine : undefined,
        city: 'Addis Ababa',
      };

      const res = await rentalApi.createBooking(payload);

      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else if (res.booking_id) {
        onClose();
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
      {/* Blurred fixed backdrop — stays completely still and prevents page scrolling */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-hidden select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg max-h-[92vh] bg-white border border-stone-200 text-stone-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner — Pinned at top */}
          <div className="relative px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-stone-50 via-purple-50/70 to-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-purple-700 block truncate">
                  {t("rentals.modalTitle", "Reserve Cultural Couture")}
                </span>
                <h2 className="text-sm sm:text-base font-serif text-stone-900 truncate">{product.name}</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-800 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingConfig ? (
            <div className="p-10 text-center text-stone-500 flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <p className="text-xs uppercase tracking-widest font-mono">{t("common.loading", "Loading atelier rental terms...")}</p>
            </div>
          ) : rentalConfig && !rentalConfig.is_rental_enabled ? (
            <div className="p-8 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-purple-600 mx-auto" />
              <h3 className="text-base font-serif text-stone-900">{t("rentals.unavailableTitle", "Rental Currently Unavailable")}</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {t("rentals.unavailableDesc", "This artisanal piece is currently not available for rental. You can still purchase this garment directly.")}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-900 text-white font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-stone-800 transition-colors"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-stone-800 bg-white">
                
                {/* Product Summary Card */}
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-stone-50 border border-stone-200 shrink-0">
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-12 h-14 sm:w-14 sm:h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-purple-700 uppercase tracking-widest font-semibold block truncate">
                      {product.brand || 'Tilet3D Atelier'}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-stone-900 truncate">{product.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                        {rentalConfig?.daily_rate} ETB / day
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                        Deposit: {rentalConfig?.security_deposit} ETB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variant / Size Selection */}
                {product.variants && product.variants.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                      {t("detail.selectSize", "Select Size / Variant")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.variants.map((v) => (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            selectedVariantId === v.id
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                              : 'bg-stone-50 border border-stone-200 text-stone-700 hover:border-purple-500/40'
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
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t("rentals.durationOptions", "Rental Duration Options")}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setPricingMode('package')}
                      className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        pricingMode === 'package'
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {t("rentals.fixedPackage", "Fixed Package")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('flexible_daily')}
                      className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        pricingMode === 'flexible_daily'
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {t("rentals.customDates", "Custom Dates")}
                    </button>
                  </div>
                </div>

                {/* Fixed Package Selection */}
                {pricingMode === 'package' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rentalConfig?.packages?.map((pkg: RentalPackage) => {
                        const isSelected = selectedPackageId === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-purple-50/80 border-purple-600 text-purple-950 shadow-sm'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-900">{pkg.name}</span>
                              <span className="text-[11px] font-mono font-bold text-purple-700">
                                {pkg.price} ETB
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              {pkg.duration_days} {t("rentals.daysAccess", "Days Full Access")}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("rentals.startDate", "Event / Pickup Start Date")}
                      </label>
                      <input
                        type="date"
                        min={defaultStartDate}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Flexible Date Picker */}
                {pricingMode === 'flexible_daily' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("rentals.startDate", "Pickup / Event Date")}
                      </label>
                      <input
                        type="date"
                        min={defaultStartDate}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("rentals.endDate", "Return Date")}
                      </label>
                      <input
                        type="date"
                        min={startDate || defaultStartDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Availability Status Badge */}
                {availability && (
                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium ${
                      availability.is_available
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {availability.is_available ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate text-[11px]">
                      {availability.is_available
                        ? `${t("rentals.available", "Garment Available")} (${availability.available_count} in atelier stock)`
                        : availability.message}
                    </span>
                  </div>
                )}

                {/* Fulfillment Method Selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t("rentals.fulfillment", "Fulfillment & Return Handover")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      onClick={() => setFulfillmentMethod('shop_pickup')}
                      className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                        fulfillmentMethod === 'shop_pickup'
                          ? 'bg-purple-50/80 border-purple-600 text-purple-950'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <Building2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-stone-900">{t("rentals.pickupTitle", "Atelier Pickup & Return")}</p>
                        <p className="text-[10px] text-stone-500">{t("rentals.pickupSubtitle", "Free · Bole Medhanialem")}</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFulfillmentMethod('delivery')}
                      className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                        fulfillmentMethod === 'delivery'
                          ? 'bg-purple-50/80 border-purple-600 text-purple-950'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <Truck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-stone-900">{t("rentals.deliveryTitle", "Courier Delivery")}</p>
                        <p className="text-[10px] text-stone-500">
                          +{rentalConfig?.delivery_fee} ETB · Doorstep Drop & Return
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Handover Details */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("checkout.fullName", "Full Name")} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Abebe Bikila"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("checkout.phone", "Phone Number")} *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+251 91 234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {fulfillmentMethod === 'delivery' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t("checkout.address", "Delivery Address (Addis Ababa)")} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bole Sub-city, Woreda 03, House 412"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Transparent Financial Quote Breakdown */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">
                      {t("rentals.duration", "Rental Duration")} ({quote?.duration_days || 0} days)
                    </span>
                    <span className="font-mono font-medium text-stone-900">
                      {quote?.rental_subtotal ?? '—'} ETB
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <span>{t("rentals.securityDeposit", "Refundable Security Deposit")}</span>
                      <Info className="h-3 w-3 text-purple-600" />
                    </div>
                    <span className="font-mono font-bold text-purple-700">
                      +{quote?.deposit_amount ?? '—'} ETB
                    </span>
                  </div>

                  {fulfillmentMethod === 'delivery' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">{t("rentals.deliveryFee", "Doorstep Delivery & Return")}</span>
                      <span className="font-mono font-medium text-stone-900">
                        +{quote?.delivery_fee ?? '—'} ETB
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        {t("rentals.totalDue", "Total Payable Today")}
                      </p>
                      <p className="text-[10px] text-purple-700 font-medium">
                        * Deposit refunded upon return inspection
                      </p>
                    </div>
                    <span className="text-lg font-mono font-bold text-purple-900">
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
                    className="mt-0.5 rounded border-stone-300 bg-stone-50 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0"
                  />
                  <span className="text-[10px] sm:text-[11px] leading-relaxed text-stone-500">
                    {t("rentals.agreement", "I agree to the Tilet3D Rental & Cultural Garment Care Policy. The security deposit will be automatically cleared upon standard atelier inspection.")}
                  </span>
                </label>

                {/* Error Alert */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Sticky Submit Footer — Pinned at bottom */}
              <div className="shrink-0 p-3 sm:p-4 bg-white/95 border-t border-stone-200 backdrop-blur-md">
                <button
                  type="submit"
                  disabled={isSubmitting || isQuoting || !rentalConfig || !quote || Boolean(errorMsg) || Boolean(availability && !availability.is_available)}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold uppercase tracking-[0.18em] rounded-full shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-purple-900/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("common.loading", "Securing Reservation...")}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rentals.reserveBtn", "Confirm & Pay via Chapa")} ({quote?.total_amount || 0} ETB)</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-stone-500 mt-1.5">
                  {t("checkout.chapaSecure", "🔒 Safe, 256-bit encrypted payment powered by Chapa. Ethiopian Birr (ETB).")}
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
