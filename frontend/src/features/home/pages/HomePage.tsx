import Navbar from "../../../shared/components/layout/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturedCollectionSection from "../components/FeaturedCollectionSection";
import HowItWorksSection from "../components/HowItWorksSection";
import Footer from "../components/Footer";

const HomePage = () => {
  return (
    <div className="bg-white text-ink">
      <Navbar />
      <HeroSection />
      <FeaturedCollectionSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
};

export default HomePage;
