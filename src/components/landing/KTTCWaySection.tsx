import { FadeUp, LineReveal } from "./ScrollReveal";
import { X, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const columns = [
  {
    title: "The Old Way",
    icon: X,
    iconBg: "bg-destructive/20",
    iconColor: "text-destructive",
    dotColor: "bg-destructive",
    titleColor: "text-destructive",
    items: [
      "Google searches for professionals",
      "Trial and error (expensive mistakes)",
      "Conflicting advice everywhere",
      "No clear roadmap or timeline",
      "Paying tourist prices for everything",
    ],
    highlight: false,
  },
  {
    title: "The Shift",
    icon: ArrowRight,
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    dotColor: "bg-primary",
    titleColor: "text-foreground",
    items: [
      "Stop wasting time, money, and energy figuring it out alone. Get the vetted network, proven playbook, and insider access from day one.",
    ],
    highlight: true,
  },
  {
    title: "The Keys Way",
    icon: Check,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    titleColor: "text-emerald-400",
    items: [
      "Vetted professionals ready to go",
      "Clear roadmap from arrival to ownership",
      "Real numbers, real timelines, real advice",
      "Community of builders on same journey",
      "Insider prices and exclusive access",
    ],
    highlight: false,
  },
];

export function KTTCWaySection() { // updated
  return (
    <section id="kttc-way" className="scroll-mt-20 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <LineReveal className="mb-16 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          {columns.map((col, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <motion.div
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex h-full flex-col rounded-xl p-8 cursor-pointer ${
                  col.highlight
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/30 bg-[hsl(220_30%_12%)]"
                }`}
              >
                {/* Icon circle */}
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full ${
                    col.highlight
                      ? "bg-primary-foreground/20"
                      : col.iconBg
                  }`}
                >
                  <col.icon
                    className={`h-5 w-5 ${
                      col.highlight ? "text-primary-foreground" : col.iconColor
                    }`}
                  />
                </div>

                {/* Title */}
                <h3
                  className={`mb-6 font-serif text-2xl font-bold ${
                    col.highlight ? "text-primary-foreground" : col.titleColor
                  }`}
                >
                  {col.title}
                </h3>

                {/* Items */}
                <ul className="flex-1 space-y-3">
                  {col.items.map((item, j) => (
                    <li
                      key={j}
                      className={`flex items-start gap-3 text-sm leading-relaxed ${
                        col.highlight
                          ? "text-primary-foreground/90"
                          : "text-muted-foreground"
                      }`}
                    >
                      {!col.highlight && (
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${col.dotColor}`}
                        />
                      )}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
