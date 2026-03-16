import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">
          Ready to Stop Floating<br />and Start Building?
        </h2>
        <p className="mt-6 text-muted-foreground">
          Join 200+ internationals who've made the shift from living abroad to owning abroad.
        </p>
        <p className="mt-2 text-sm italic text-muted-foreground">
          You already made the hard move. Now let us help you do the smart part.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Get Started
            </Button>
          </Link>
          <a href="#experiences">
            <Button size="lg" variant="outline" className="border-border text-foreground px-8">
              View Experiences
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
