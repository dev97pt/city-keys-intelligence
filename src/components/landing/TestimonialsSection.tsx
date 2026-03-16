import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "I spent 6 months browsing Idealista getting nowhere. One Discovery Experience and I had clarity, a concrete plan. Bought my apartment 3 months later.",
    name: "Marcus J.",
    role: "Tech Professional, Lisbon",
  },
  {
    quote: "The platform alone saved me €15k by showing me the real costs before I overpaid. The vetted contacts, and a lawyer caught issues the seller was hiding. Worth 100x the membership.",
    name: "Amara T.",
    role: "Entrepreneur, Porto",
  },
  {
    quote: "Finally, someone who tells you the truth instead of what you want to hear. Ismael told me I wasn't ready yet and gave me a 6-month roadmap. Best advice I got.",
    name: "James K.",
    role: "Creative Director, Remote",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-serif text-4xl font-semibold text-foreground sm:text-5xl"
        >
          What Members Say
        </motion.h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-lg border border-border/50 bg-card/50 p-8"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
