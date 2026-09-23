import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from '@/shared/components/Toast';
import { useLocation } from "react-router-dom";
import { TiletAssistant } from "@/features/ai/components/TiletAssistant"; // <-- Import the AI assistant

type Props = {
  children: React.ReactNode;
};

const PageLayout = ({ children }: Props) => {
  const location = useLocation();
  const hideAssistant = location.pathname === "/ai-concierge"; // avoid duplicate chat UIs[cite: 1]

  return (
    <>
      <Navbar />
      <Toast />
      <main>
        {children}
      </main>
      {!hideAssistant && <TiletAssistant />} {/* <-- Renders floating globally conditionally[cite: 1] */}
      <Footer />
    </>
  );
};

export default PageLayout;