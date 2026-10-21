import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";

const ProductsPage = lazy(
  () => import("../../features/products/pages/ProductsPage"),
);

const CategoryDetailPage = lazy(
  () => import("../../features/products/pages/CategoryDetailPage"),
);

const ProductDetailPage = lazy(
  () => import("../../features/products/pages/ProductDetailPage"),
);

const AiConciergePage = lazy(
  () => import("../../features/ai/pages/AiConciergePage")
);

// FIXED: Removed the .then() block and matched the path style of other routes
const AvatarPage = lazy(
  () => import("../../features/avatar/pages/AvatarPage"),
);

const OrderHistoryPage = lazy(
  () => import("../../features/orders/pages/OrderHistoryPage"),
);

const OrderDetailPage = lazy(
  () => import("../../features/orders/pages/OrderDetailPage"),
);

const CheckoutSuccessPage = lazy(
  () => import("../../features/orders/pages/CheckoutSuccessPage"),
);

const AccountPage = lazy(
  () => import("../../features/account/pages/AccountPage"),
);

const AdminOverviewPage = lazy(
  () => import("../../features/admin/pages/AdminOverviewPage"),
);

const AdminProductsPage = lazy(
  () => import("../../features/admin/pages/AdminProductsPage"),
);

const AdminCategoriesPage = lazy(
  () => import("../../features/admin/pages/AdminCategoriesPage"),
);

const AdminInventoryPage = lazy(
  () => import("../../features/admin/pages/AdminInventoryPage"),
);

const AdminOrdersPage = lazy(
  () => import("../../features/admin/pages/AdminOrdersPage"),
);

const AdminCustomersPage = lazy(
  () => import("../../features/admin/pages/AdminCustomersPage"),
);

const AdminPaymentsPage = lazy(
  () => import("../../features/admin/pages/AdminPaymentsPage"),
);

const AdminAnalyticsPage = lazy(
  () => import("../../features/admin/pages/AdminAnalyticsPage"),
);

const AdminPromotionsPage = lazy(
  () => import("../../features/admin/pages/AdminPromotionsPage"),
);

const AdminAuditLogsPage = lazy(
  () => import("../../features/admin/pages/AdminAuditLogsPage"),
);

const AdminSettingsPage = lazy(
  () => import("../../features/admin/pages/AdminSettingsPage"),
);

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        
        {/* Category Detail Page ("More" button) */}
        <Route path="/products/category/:categoryName" element={<CategoryDetailPage />} />
        
        {/* Product Detail Page */}
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/ai-concierge" element={<AiConciergePage />} />
        {/* Avatar Studio */}
        <Route path="/avatar" element={<AvatarPage />} />
        
        {/* Checkout & Payment Receipt */}
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/orders/success" element={<CheckoutSuccessPage />} />

        {/* Orders */}
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<AccountPage initialMode="login" />} />
        <Route path="/register" element={<AccountPage initialMode="register" />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/admin/overview" element={<AdminOverviewPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/inventory" element={<AdminInventoryPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/:section" element={<AdminOverviewPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;