import AppRoutes from "./app/routes/AppRoutes";
import { ScrollToTop } from "./shared/components/layout/ScrollToTop";

function App() {
  return (
    <div className="relative min-h-screen bg-white text-ink antialiased overflow-x-hidden w-full max-w-[100vw]">
      <ScrollToTop />
      <AppRoutes />
    </div>
  );
}

export default App;
