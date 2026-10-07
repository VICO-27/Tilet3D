import AppRoutes from "./app/routes/AppRoutes";
import { ScrollToTop } from "./shared/components/layout/ScrollToTop";
import { Suspense, lazy } from "react";
const FloatingAssistant = lazy(() => import("./features/ai/components/FloatingAssistant").then(m => ({ default: m.FloatingAssistant })));

function App() {
  return (
    <div className="relative min-h-screen bg-white text-ink antialiased overflow-x-hidden w-full max-w-[100vw]">
      <ScrollToTop />
      <AppRoutes />
      <Suspense fallback={null}><FloatingAssistant /></Suspense>
    </div>
  );
}

export default App;
