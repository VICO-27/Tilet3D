import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  Filter,
  RotateCw,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Sparkles,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AccessDenied from "../components/AccessDenied";
import { useAuthStore } from "@/app/store/useAuthStore";
import { rentalApi } from "@/features/rentals/api/rentalApi";
import {
  RentalBooking,
  RentalBookingStatus,
  AdminRentalMetrics,
  GarmentCondition,
} from "@/features/rentals/types";

export const AdminRentalsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [metrics, setMetrics] = useState<AdminRentalMetrics | null>(null);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inspection modal state
  const [inspectingBooking, setInspectingBooking] = useState<RentalBooking | null>(null);
  const [inspectionCondition, setInspectionCondition] = useState<GarmentCondition>("pristine");
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [inspectionDamageFee, setInspectionDamageFee] = useState<number>(0);
  const [inspectionDepositAction, setInspectionDepositAction] = useState<string>("refund_full");

  // Detail view modal
  const [viewingBooking, setViewingBooking] = useState<RentalBooking | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await rentalApi.getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load rental metrics", err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
      };
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await rentalApi.getAdminBookings(params);
      setBookings(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 12) || 1);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load rental reservations.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedStatus, search]);

  useEffect(() => {
    if (user?.is_staff) {
      fetchMetrics();
      fetchBookings();
    }
  }, [user, fetchMetrics, fetchBookings]);

  if (!user?.is_staff) {
    return <AccessDenied />;
  }

  const handleStatusTransition = async (
    bookingId: string,
    action: "ready_for_pickup" | "handover" | "record_return" | "cancel"
  ) => {
    setActionLoading(bookingId);
    try {
      await rentalApi.adminTransitionBooking(bookingId, action);
      await fetchBookings();
      await fetchMetrics();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update rental status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingBooking) return;

    setActionLoading(inspectingBooking.id);
    try {
      await rentalApi.adminInspectBooking(inspectingBooking.id, {
        condition: inspectionCondition,
        notes: inspectionNotes,
        assessed_damage_fee: Number(inspectionDamageFee) || 0,
        deposit_action: inspectionDepositAction,
      });
      setInspectingBooking(null);
      await fetchBookings();
      await fetchMetrics();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save garment inspection.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: RentalBookingStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "ready_for_pickup":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "out_on_rental":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "returned_pending_inspection":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "completed":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "overdue":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "pending_payment":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "cancelled":
        return "bg-zinc-800 text-zinc-500 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-purple-400">
              Operations & Inventory Lifecycle
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
              Garment Rental Management
            </h1>
          </div>

          <button
            onClick={() => {
              fetchMetrics();
              fetchBookings();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 text-zinc-300 rounded-full text-xs font-semibold hover:border-purple-500/40 hover:text-white transition-all self-start sm:self-auto"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh Directory
          </button>
        </div>

        {/* Operational Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Bookings</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{metrics.total_rentals}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-purple-500/20">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Active on Rental</span>
              <p className="text-2xl font-bold font-mono text-purple-400 mt-1">{metrics.active_rentals}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-rose-500/20">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Overdue Returns</span>
              <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{metrics.overdue_count}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-purple-500/20">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Pending Inspection</span>
              <p className="text-2xl font-bold font-mono text-purple-400 mt-1">{metrics.pending_inspection}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Deposits Held</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{metrics.deposits_held_etb} ETB</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Rental Revenue</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics.rental_revenue_etb} ETB</p>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search reference, garment, customer, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {[
              { id: "", label: "All Statuses" },
              { id: "confirmed", label: "Confirmed" },
              { id: "ready_for_pickup", label: "Ready" },
              { id: "out_on_rental", label: "Out on Rental" },
              { id: "returned_pending_inspection", label: "Inspecting" },
              { id: "completed", label: "Completed" },
              { id: "overdue", label: "Overdue" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatus === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/30"
                    : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center text-zinc-400 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-xs font-mono uppercase tracking-widest">Loading rental reservations...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-400 text-sm">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <Package className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm">No rental bookings found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400 border-b border-white/10 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">Garment</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Dates & Duration</th>
                    <th className="py-3.5 px-4">Financials</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Deposit</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((booking) => {
                    const statusClass = getStatusBadge(booking.status);

                    return (
                      <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                          {booking.booking_reference}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {booking.product_image ? (
                              <img
                                src={booking.product_image}
                                alt={booking.product_name}
                                className="w-9 h-11 object-cover rounded-lg border border-white/10"
                              />
                            ) : (
                              <div className="w-9 h-11 rounded-lg bg-zinc-900 flex items-center justify-center">
                                <Package className="h-4 w-4 text-zinc-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white max-w-[160px] truncate">
                                {booking.product_name}
                              </p>
                              {booking.variant_name && (
                                <span className="text-[10px] text-zinc-400">Size: {booking.variant_name}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-white">{booking.full_name || booking.customer_name}</p>
                          <p className="text-[10px] text-zinc-400">{booking.phone}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-white font-medium">
                            {booking.start_date} → {booking.end_date}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {booking.duration_days} Days · {booking.fulfillment_method === "shop_pickup" ? "Pickup" : "Delivery"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-white">{booking.total_amount} ETB</p>
                          <p className="text-[10px] text-zinc-400">
                            Rent: {booking.rental_subtotal} · Dep: {booking.deposit_amount}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusClass}`}
                          >
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              booking.deposit_status === "held"
                                ? "bg-purple-500/10 text-purple-400"
                                : booking.deposit_status === "released"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {booking.deposit_status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingBooking(booking)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {booking.status === "confirmed" && (
                              <button
                                disabled={actionLoading === booking.id}
                                onClick={() => handleStatusTransition(booking.id, "ready_for_pickup")}
                                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                              >
                                Ready
                              </button>
                            )}

                            {(booking.status === "confirmed" || booking.status === "ready_for_pickup") && (
                              <button
                                disabled={actionLoading === booking.id}
                                onClick={() => handleStatusTransition(booking.id, "handover")}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                              >
                                Handover
                              </button>
                            )}

                            {(booking.status === "out_on_rental" || booking.status === "overdue") && (
                              <button
                                disabled={actionLoading === booking.id}
                                onClick={() => handleStatusTransition(booking.id, "record_return")}
                                className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                              >
                                Return
                              </button>
                            )}

                            {booking.status === "returned_pending_inspection" && (
                              <button
                                onClick={() => {
                                  setInspectingBooking(booking);
                                  setInspectionCondition("pristine");
                                  setInspectionNotes("");
                                  setInspectionDamageFee(0);
                                  setInspectionDepositAction("refund_full");
                                }}
                                className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-[10px] font-bold uppercase transition-colors shadow-md shadow-purple-900/30"
                              >
                                Inspect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <span>
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1 rounded-lg bg-zinc-900 border border-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 rounded-lg bg-zinc-900 border border-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Inspection Modal */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-serif font-bold text-white">
                  Garment Return Inspection & Deposit Settlement
                </h3>
              </div>
              <button
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Garment</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {inspectingBooking.product_name} ({inspectingBooking.booking_reference})
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Deposit Held: <strong className="text-purple-400 font-mono">{inspectingBooking.deposit_amount} ETB</strong>
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
                  Garment Condition Assessment *
                </label>
                <select
                  value={inspectionCondition}
                  onChange={(e) => setInspectionCondition(e.target.value as GarmentCondition)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pristine">Pristine / Excellent (No Wear or Odor)</option>
                  <option value="minor_wear">Minor Wear (Normal Usage, Eco-cleaning clears)</option>
                  <option value="repairable_damage">Repairable Damage (Requires Tailor Restitching)</option>
                  <option value="severe_damage">Severe / Irreparable Damage</option>
                  <option value="lost">Item Lost / Not Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
                  Deposit Disposition Action *
                </label>
                <select
                  value={inspectionDepositAction}
                  onChange={(e) => setInspectionDepositAction(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="refund_full">Refund Full Deposit (100% Cleared)</option>
                  <option value="deduct_damage">Deduct Damage Fee & Refund Remaining Balance</option>
                  <option value="forfeit_all">Forfeit Entire Security Deposit</option>
                </select>
              </div>

              {inspectionDepositAction === "deduct_damage" && (
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
                    Assessed Damage / Cleaning Fee (ETB) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={Number(inspectingBooking.deposit_amount)}
                    value={inspectionDamageFee}
                    onChange={(e) => setInspectionDamageFee(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Customer will be refunded:{" "}
                    <strong className="text-emerald-400 font-mono">
                      {Math.max(0, Number(inspectingBooking.deposit_amount) - (inspectionDamageFee || 0))} ETB
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
                  Inspection Notes & Atelier Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Record seam integrity, fabric condition, beadwork, or cleaning notes..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingBooking(null)}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 rounded-full font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === inspectingBooking.id}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold uppercase rounded-full hover:brightness-110 shadow-lg shadow-purple-900/30"
                >
                  Confirm & Finalize Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                  {viewingBooking.booking_reference}
                </span>
                <h3 className="text-base font-serif font-bold text-white">{viewingBooking.product_name}</h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Customer:</span>
                <span className="text-white font-medium">
                  {viewingBooking.full_name} ({viewingBooking.customer_email})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Phone:</span>
                <span className="text-white font-mono">{viewingBooking.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Fulfillment Method:</span>
                <span className="text-white font-medium">
                  {viewingBooking.fulfillment_method === "shop_pickup"
                    ? "Atelier Pickup (Bole Medhanialem)"
                    : "Doorstep Courier Delivery"}
                </span>
              </div>
              {viewingBooking.address_line && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Delivery Address:</span>
                  <span className="text-white text-right">{viewingBooking.address_line}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Dates:</span>
                <span className="text-white">
                  {viewingBooking.start_date} → {viewingBooking.end_date} ({viewingBooking.duration_days} days)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Financials:</span>
                <span className="text-white font-mono">
                  Rent: {viewingBooking.rental_subtotal} ETB · Deposit: {viewingBooking.deposit_amount} ETB · Total:{" "}
                  {viewingBooking.total_amount} ETB
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Deposit Status:</span>
                <span className="text-purple-400 uppercase font-semibold">{viewingBooking.deposit_status}</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setViewingBooking(null)}
                className="px-5 py-1.5 bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRentalsPage;
