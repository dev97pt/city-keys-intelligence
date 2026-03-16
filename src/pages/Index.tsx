import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { KTTCWaySection } from "@/components/landing/KTTCWaySection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FounderSection } from "@/components/landing/FounderSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <KTTCWaySection />
      <HowItWorksSection />
      <PlatformSection />
      <TestimonialsSection />
      <FounderSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
