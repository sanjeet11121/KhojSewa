import AboutPreview from "../components/AboutPreview";
import CTASection from "../components/CTASection";
import Features from "../components/Features";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import Navbar from "../components/Navbar";




const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar/>
      <HeroSection />
      <Features />
      <AboutPreview />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
