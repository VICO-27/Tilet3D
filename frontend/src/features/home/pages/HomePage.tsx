import Navbar from "../../../shared/components/layout/Navbar";
import HeroSection from "../components/HeroSection";
import { lazy, Suspense } from 'react';

const FeaturedCollectionSection = lazy(() => import('../components/FeaturedCollectionSection'));
const CulturalCollectionSection = lazy(() => import('../components/CulturalCollectionSection'));
const HowItWorksSection = lazy(() => import('../components/HowItWorksSection'));
const Footer = lazy(() => import('../components/Footer'));

const HomePage = () => {
  return (
    <div className="bg-white text-ink">
      <Navbar />
      <HeroSection />
      <Suspense fallback={<div className="h-96" />}><FeaturedCollectionSection /></Suspense>
      <Suspense fallback={<div className="h-96" />}><CulturalCollectionSection /></Suspense>
      <Suspense fallback={<div className="h-96" />}><HowItWorksSection /></Suspense>
      <Suspense fallback={<div className="h-48" />}><Footer /></Suspense>
    </div>
  );
};

export default HomePage;