import AboutPreview from "../components/AboutPreview";
import CTASection from "../components/CTASection";
import Features from "../components/Features";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import Navbar from "../components/Navbar";
import LostItemsSection from "../components/LostItemsSection";




const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar/>
      <HeroSection />
      <LostItemsSection />
      <Features />
      <AboutPreview />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
