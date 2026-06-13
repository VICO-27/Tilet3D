import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";

// Route-level code-splitting: heavy pages (Three.js, video grids) load on demand
// so the initial bundle stays small and the first page paints fast.
const ProductsPage = lazy(
  () => import("../../features/products/pages/ProductsPage"),
);
const AvatarPage = lazy(() =>
  import("@/features/avatar/pages/AvatarPage").then((m) => ({
    default: m.AvatarPage,
  })),
);
const OrderHistoryPage = lazy(
  () => import("../../features/orders/pages/OrderHistoryPage"),
);
const AccountPage = lazy(
  () => import("../../features/account/pages/AccountPage"),
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
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
