import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TextReveal, FadeUp } from "./ScrollReveal";
import { Compass, Plane } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <TextReveal
          as="h2"
          className="font-serif text-4xl font-semibold text-primary sm:text-5xl"
        >
          Ready to Stop Floating
        </TextReveal>
        <TextReveal
          as="h2"
          className="font-serif text-4xl font-semibold text-primary sm:text-5xl"
          delay={0.1}
        >
          and Start Building?
        </TextReveal>
        <FadeUp delay={0.2}>
          <p className="mt-6 text-muted-foreground">
            Join 200+ internationals who've made the shift from living in Portugal to owning in Portugal.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Start with Navigator */}
            <motion.div
              initial={{ scale: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center rounded-xl border border-border/30 bg-[hsl(220_30%_14%)] p-10 cursor-pointer"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <Compass className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary">Start with Navigator</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Get immediate access to the platform, playbooks, and partner directory. 7-day free trial.
              </p>
              <Link to="/signup" className="mt-6">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>

            {/* Book an Experience */}
            <motion.div
              initial={{ scale: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center rounded-xl border border-primary/30 bg-[hsl(220_30%_14%)] p-10 cursor-pointer"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <Plane className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary">Book an Experience</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Ready to see it in person? Join the next Discovery Experience or apply for the VIP Retreat.
              </p>
              <a href="#experiences" className="mt-6">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8">
                  View Dates
                </Button>
              </a>
            </motion.div>
          </div>
        </FadeUp>

        <FadeUp delay={0.5}>
          <p className="mt-10 text-sm italic text-muted-foreground">
            "You already made the hard move. Now let me help you do the smart part."
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
