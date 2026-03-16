import { motion } from "framer-motion";
import { Users, Crown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const paths = [
  {
    icon: Users,
    title: "Explorer",
    tag: "Group Experience",
    price: "€1,999",
    desc: "3–4 day city immersion. Neighborhood tours, property visits, meetings with partners, and group dinners.",
    features: [
      "Curated neighborhood tours with local guides",
      "Property viewings across budgets",
      "Meet 5–7 vetted partners in person",
      "Group dinners & networking",
    ],
    cta: "Book Experience",
  },
  {
    icon: Crown,
    title: "Builder",
    tag: "Private Experience",
    price: "€4,500",
    desc: "5–7 day VIP retreat. One-on-one strategy, off-market properties, deal analysis, and personalized support.",
    features: [
      "1-on-1 strategy session with founder",
      "Private property tours (off-market access)",
      "Deal analysis & tax optimization",
      "3-month post-retreat support",
    ],
    cta: "Apply for Retreat",
    popular: true,
  },
  {
    icon: Calendar,
    title: "Consultancy",
    tag: "Strategy Session",
    price: "Book a Call",
    desc: "One-on-one strategy session. Get personalized advice on relocation, property, and investment.",
    features: [
      "Personalized relocation strategy",
      "Investment analysis & recommendations",
      "Partner introductions",
      "Follow-up action plan",
    ],
    cta: "Book Consultation",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three pathways to build your life abroad. Choose your level of support.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {paths.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col rounded-lg border p-8 transition-all duration-300 ${
                p.popular
                  ? "border-primary/40 bg-primary/5 hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]"
                  : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.1)]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}
              <p.icon className="h-8 w-8 text-primary" />
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="font-serif text-2xl font-semibold text-foreground">{p.title}</h3>
                <span className="font-mono text-sm text-primary">{p.price}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tag}</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              <ul className="mt-6 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-8 w-full ${
                  p.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {p.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
