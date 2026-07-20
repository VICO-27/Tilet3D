import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";

const ProductsPage = lazy(
  () => import("../../features/products/pages/ProductsPage"),
);

const CategoryDetailPage = lazy(
  () => import("../../features/products/pages/CategoryDetailPage"),
);

// Lazy load the Product Detail Page
const ProductDetailPage = lazy(
  () => import("../../features/products/pages/ProductDetailPage"),
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
        
        {/* Category Detail Page ("More" button) */}
        <Route path="/products/category/:categoryName" element={<CategoryDetailPage />} />
        
        {/* Product Detail Page */}
        <Route path="/products/:id" element={<ProductDetailPage />} />
        
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;