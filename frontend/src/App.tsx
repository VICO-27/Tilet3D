import AppRoutes from "./app/routes/AppRoutes";
import { ScrollToTop } from "./shared/components/layout/ScrollToTop";
import { FloatingAssistant } from "./features/ai/components/FloatingAssistant";

function App() {
  return (
    <div className="relative min-h-screen bg-white text-ink antialiased overflow-x-hidden w-full max-w-[100vw]">
      <ScrollToTop />
      <AppRoutes />
      <FloatingAssistant />
    </div>
  );
}

export default App;
