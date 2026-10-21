import React from "react";
import { Tag, Sparkles, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import AccessDenied from "../components/AccessDenied";
import { useAuthStore } from "@/app/store/useAuthStore";

export const AdminPromotionsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  if (user && !user.is_staff) {
    return <AccessDenied />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Promotions &amp; Discounts
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Campaign rules, promotional vouchers, and seasonal discount management.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Architecture Status: Post-Launch Phase</span>
          </div>
        </div>

        {/* Notice Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-stone-100 rounded-lg text-stone-700">
              <Tag className="w-6 h-6 text-stone-800" />
            </div>
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-lg font-serif font-semibold text-stone-900">
                Promotional Engine Not Implemented in Current Schema
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                In strict adherence to commerce integrity and audit policies, promotional codes,
                coupons, and automated cart discount rules are not enabled in the current database
                schema. Order checkout calculates tax, shipping, and product totals directly via the
                verified <code className="px-1.5 py-0.5 bg-stone-100 text-stone-800 rounded text-xs font-mono">OrderLifecycle</code> service.
              </p>
              <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero client-side price tampering allowed: Checkout total integrity is strictly preserved server-side.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Planned Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-plum-50 border border-plum-100 flex items-center justify-center text-plum-700 font-semibold text-sm">
              1
            </div>
            <h3 className="text-sm font-semibold text-stone-900">Cultural &amp; Seasonal Campaigns</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Targeted promotions tailored for Ethiopian holidays such as Enkutatash, Meskel, Genna, and Fasika with configurable start and expiration dates.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Date-bounded campaigns
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Collection-level discounts
              </li>
            </ul>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-plum-50 border border-plum-100 flex items-center justify-center text-plum-700 font-semibold text-sm">
              2
            </div>
            <h3 className="text-sm font-semibold text-stone-900">Voucher &amp; Coupon Codes</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Single-use or reusable alphanumeric codes with maximum redemption limits, per-customer usage counters, and minimum cart value restrictions.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Percentage &amp; fixed discounts
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Minimum order thresholds
              </li>
            </ul>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-plum-50 border border-plum-100 flex items-center justify-center text-plum-700 font-semibold text-sm">
              3
            </div>
            <h3 className="text-sm font-semibold text-stone-900">VIP &amp; Patron Privileges</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Tier-based automatic discounts tied to customer lifetime spend and loyalty status within Tilet3D&apos;s haute couture clientele.
            </p>
            <ul className="text-xs text-stone-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Patron tier qualification
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Automatic cart redemption
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Architecture Note */}
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 text-xs text-stone-600 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Architecture Decision:</strong> In keeping with strict financial audit requirements, no mock coupon discounts are accepted during checkout. When this module is activated, atomic backend validation will verify all discount calculations during <code className="font-mono text-stone-800">create_order</code>.
          </span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPromotionsPage;
