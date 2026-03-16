import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(37_62%_75%/0.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          className="font-serif text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
        >
          From Arrival<br />to Ownership
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.2, 0, 0, 1] }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          The insider platform for internationals building life abroad.
        </motion.p>

        {/* Founder quote card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0, 0, 1] }}
          className="mx-auto mt-10 max-w-xl rounded-lg border border-border/50 bg-card/60 p-6 backdrop-blur-sm"
        >
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            "I'd rather crush your dreams now than watch you lose €100k later.
            This platform gives you the truth, the tools, and the team to build right."
          </p>
          <p className="mt-3 text-xs font-medium text-primary">
            Ismael — Founder
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.2, 0, 0, 1] }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
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
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-16 flex max-w-md justify-center gap-12"
        >
          {[
            { value: "200+", label: "Members" },
            { value: "50+", label: "Vetted Partners" },
            { value: "3", label: "Cities" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-2xl font-semibold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
