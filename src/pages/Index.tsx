import { useState, useCallback, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { IntroLoader } from "@/components/landing/IntroLoader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { KTTCWaySection } from "@/components/landing/KTTCWaySection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { FounderSection } from "@/components/landing/FounderSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const Index = () => {
  const [loaderDone, setLoaderDone] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
  }, []);

  // Scroll to a hash target once the intro loader is out of the way
  useEffect(() => {
    if (!loaderDone) return;
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(t);
  }, [loaderDone]);


  return (
    <div className="min-h-screen bg-background">
      {!loaderDone && <IntroLoader onComplete={handleLoaderComplete} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={loaderDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Navbar />
        <HeroSection />
        <ProblemSection />
        <KTTCWaySection />
        <PlatformSection />
        <FounderSection />
        <CTASection />
        <Footer />
      </motion.div>
    </div>
  );
};

export default Index;
