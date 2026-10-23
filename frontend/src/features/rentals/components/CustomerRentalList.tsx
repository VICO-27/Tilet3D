import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Building2,
  Truck,
  ShieldCheck,
  ChevronRight,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { rentalApi } from '../api/rentalApi';
import { RentalBooking, RentalBookingStatus, DepositStatus } from '../types';
import { useTranslation } from 'react-i18next';

export const CustomerRentalList: React.FC = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalApi.getMyRentals();
      setBookings(data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const getStatusBadge = (status: RentalBookingStatus) => {
    switch (status) {
      case 'confirmed':
        return { label: t("rentals.confirmed", "Confirmed"), color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'ready_for_pickup':
        return { label: t("rentals.readyForPickup", "Ready for Pickup"), color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'out_on_rental':
        return { label: t("rentals.outOnRental", "Out on Rental"), color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'returned_pending_inspection':
        return { label: t("rentals.returnedPendingInspection", "Returned (Inspecting)"), color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'completed':
        return { label: t("rentals.completed", "Completed"), color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      case 'overdue':
        return { label: t("rentals.overdue", "Overdue"), color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'pending_payment':
        return { label: t("rentals.pendingPayment", "Payment Pending"), color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'cancelled':
        return { label: t("rentals.cancelled", "Cancelled"), color: 'bg-zinc-800 text-zinc-500 border-zinc-700' };
      default:
        return { label: status, color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const getDepositBadge = (status: DepositStatus) => {
    switch (status) {
      case 'held':
        return { label: t("rentals.depositHeld", "Deposit Held"), color: 'text-purple-400 bg-purple-500/10' };
      case 'released':
        return { label: t("rentals.depositRefunded", "Deposit Refunded"), color: 'text-emerald-400 bg-emerald-500/10' };
      case 'partially_refunded':
        return { label: t("rentals.partiallyRefunded", "Partially Refunded"), color: 'text-blue-400 bg-blue-500/10' };
      case 'forfeited':
        return { label: t("rentals.depositForfeited", "Deposit Forfeited"), color: 'text-rose-400 bg-rose-500/10' };
      default:
        return { label: status, color: 'text-zinc-400 bg-zinc-800' };
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-xs font-mono uppercase tracking-widest">{t("common.loading", "Loading your rental reservations...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-950/20 border border-rose-500/20 rounded-3xl max-w-lg mx-auto">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-zinc-300">{error}</p>
        <button
          onClick={fetchRentals}
          className="mt-4 px-6 py-2 bg-white text-black text-xs font-bold uppercase rounded-full hover:bg-zinc-200"
        >
          {t("common.tryAgain", "Try Again")}
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto px-4">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Sparkles className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-serif text-white">{t("rentals.noRentals", "No Rentals Yet")}</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          {t("rentals.modalSubtitle", "Experience Ethiopia's finest traditional Kemis and bespoke cultural garments without purchasing. Rent for weddings, holidays, or special celebrations.")}
        </p>
        <a
          href="/products"
          className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:brightness-110 shadow-lg shadow-purple-900/30"
        >
          {t("rentals.browseRentals", "Browse Rentable Pieces")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((booking) => {
          const statusConfig = getStatusBadge(booking.status);
          const depositConfig = getDepositBadge(booking.deposit_status);

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-purple-500/30 transition-all shadow-xl group flex flex-col justify-between"
            >
              <div>
                {/* Header: Ref & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-mono font-bold text-purple-400 tracking-wider">
                    {booking.booking_reference}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Garment Details */}
                <div className="flex items-center gap-4 py-4">
                  {booking.product_image ? (
                    <img
                      src={booking.product_image}
                      alt={booking.product_name}
                      className="w-16 h-20 object-cover rounded-xl border border-white/10"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600">
                      <Package className="h-6 w-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="text-sm font-serif font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {booking.product_name}
                    </h4>
                    {booking.variant_name && (
                      <p className="text-[11px] text-zinc-400 mt-0.5">{t("rentals.size", "Size:")} {booking.variant_name}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-purple-400" />
                      <span>
                        {booking.start_date} → {booking.end_date} ({booking.duration_days} {t("rentals.days", "days")})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px]">{t("rentals.totalDue", "Total Paid:")}</span>
                    <span className="ml-1.5 font-mono font-bold text-white">
                      {booking.total_amount} ETB
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${depositConfig.color}`}>
                    {depositConfig.label} ({booking.deposit_amount} ETB)
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  {booking.fulfillment_method === 'shop_pickup' ? (
                    <>
                      <Building2 className="h-3.5 w-3.5 text-purple-400" />
                      <span>{t("rentals.pickupTitle", "Atelier Pickup")}</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-3.5 w-3.5 text-purple-400" />
                      <span>{t("rentals.deliveryTitle", "Doorstep Delivery")}</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="px-4 py-1.5 text-xs font-semibold text-purple-400 hover:text-white hover:bg-purple-600 border border-purple-400/40 rounded-full transition-all flex items-center gap-1"
                >
                  <span>{t("common.details", "Details")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                    {selectedBooking.booking_reference}
                  </span>
                  <h3 className="text-lg font-serif text-white">{selectedBooking.product_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dates & Status */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">{t("rentals.periodLabel", "Rental Period:")}</span>
                  <span className="font-medium text-white">
                    {selectedBooking.start_date} to {selectedBooking.end_date} ({selectedBooking.duration_days} {t("rentals.days", "days")})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">{t("rentals.statusLabel", "Current Status:")}</span>
                  <span className="font-semibold text-purple-400 uppercase tracking-wider">
                    {getStatusBadge(selectedBooking.status).label}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">{t("rentals.fulfillmentLabel", "Fulfillment Method:")}</span>
                  <span className="text-white">
                    {selectedBooking.fulfillment_method === 'shop_pickup'
                      ? t("rentals.pickupLocation", "Shop Pickup at Bole Atelier")
                      : t("rentals.courierDelivery", "Doorstep Courier Delivery")}
                  </span>
                </div>
                {selectedBooking.address_line && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">{t("rentals.addressLabel", "Delivery Address:")}</span>
                    <span className="text-white text-right max-w-xs">{selectedBooking.address_line}</span>
                  </div>
                )}
              </div>

              {/* Financial Snapshot */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t("rentals.subtotalLabel", "Rental Subtotal:")}</span>
                  <span className="font-mono text-white">{selectedBooking.rental_subtotal} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t("rentals.depositLabel", "Security Deposit:")}</span>
                  <span className="font-mono text-purple-400">+{selectedBooking.deposit_amount} ETB</span>
                </div>
                {selectedBooking.delivery_fee && Number(selectedBooking.delivery_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">{t("rentals.deliveryFeeLabel", "Delivery Fee:")}</span>
                    <span className="font-mono text-white">+{selectedBooking.delivery_fee} ETB</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
                  <span>{t("rentals.totalLabel", "Total Amount:")}</span>
                  <span className="font-mono text-white">{selectedBooking.total_amount} ETB</span>
                </div>
              </div>

              {/* Return Policy Notice */}
              <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Deposit status: <strong className="uppercase">{getDepositBadge(selectedBooking.deposit_status).label}</strong>.
                  Please return the garment on or before <strong>{selectedBooking.end_date}</strong>.
                  Our atelier will inspect the piece and release your deposit within 24 hours.
                </p>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-6 py-2 bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-zinc-200"
                >
                  {t("common.close", "Close")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerRentalList;
