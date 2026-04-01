import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TextReveal, FadeUp } from "./ScrollReveal";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(37_62%_75%/0.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <TextReveal
          as="h1"
          className="font-serif text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
        >
          From Arrival
        </TextReveal>
        <TextReveal
          as="h1"
          className="font-serif text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          delay={0.12}
        >
          to Ownership
        </TextReveal>

        <FadeUp delay={0.4}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The insider platform for internationals building life abroad.
          </p>
        </FadeUp>

        {/* Founder quote card */}
        <FadeUp delay={0.55}>
          <div className="mx-auto mt-10 max-w-xl rounded-lg border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              "I'd rather crush your dreams now than watch you lose 100K later. This platform gives you the truth, the tools, and the team to build roots the right way.”
            </p>
            <p className="mt-3 text-xs font-medium text-primary">
              Ismael GQ -  Founder
            </p>
          </div>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={0.7}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base">
                Get Started
              </Button>
            </Link>
            <a href="#experiences">
              <Button size="lg" variant="outline" className="border-border text-foreground px-8 text-base">
                Explore Experiences
              </Button>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
