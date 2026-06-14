import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import HeroSection from "@/components/HeroSection";
import LiveDemoSection from "@/components/LiveDemoSection";
import PredictionPanel from "@/components/PredictionPanel";
import TextOutputSection from "@/components/TextOutputSection";
import ControlPanel from "@/components/ControlPanel";
import SystemStatus from "@/components/SystemStatus";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="relative min-h-screen overflow-x-hidden">
    <ParticleBackground />
    <Navbar />
    <HeroSection />
    <LiveDemoSection />
    <SystemStatus />
    <TextOutputSection />
    <ControlPanel />
    <HowItWorks />
    <FeaturesSection />
    <Footer />
  </div>
);

export default Index;
