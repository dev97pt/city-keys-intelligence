import { FadeUp, LineReveal } from "./ScrollReveal";

const columns = [
  {
    title: "The Old Way",
    items: [
      "Google searches for professionals",
      "Trial and error (expensive mistakes)",
      "Conflicting advice everywhere",
      "Paying tourist prices for everything",
    ],
    accent: false,
  },
  {
    title: "The Shift",
    items: [
      "Stop wasting time, money, and energy figuring it out alone.",
      "Get the vetted network, proven playbook, and insider access from day one.",
    ],
    accent: false,
  },
  {
    title: "",
    kttcBrand: true,
    items: [
      "Vetted professionals ready to go",
      "Clear roadmap from arrival to ownership",
      "Real numbers, real timelines, real advice",
      "Community of builders on same journey",
      "Insider prices and exclusive access",
    ],
    accent: true,
  },
];

export function KTTCWaySection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <LineReveal className="mb-16 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          {columns.map((col, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <div
                className={`rounded-lg border p-8 ${
                  col.accent
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {col.kttcBrand ? (
                  <h3 className="mb-6 text-2xl">
                    <span className="font-serif text-3xl font-bold text-primary">K</span>
                    <span className="font-sans text-lg font-medium tracking-tight text-primary/80">tt</span>
                    <span className="font-serif text-3xl font-bold text-primary">C</span>
                    <span className="ml-2 font-serif text-xl text-foreground">Way</span>
                  </h3>
                ) : (
                  <h3 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                    {col.title}
                  </h3>
                )}
                <ul className="space-y-3">
                  {col.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                      {col.accent && (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
