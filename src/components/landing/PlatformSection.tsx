import { FileText, Video, Users, Calculator, CheckSquare, MapPin, Percent, BookOpen } from "lucide-react";
import { TextReveal, FadeUp } from "./ScrollReveal";

const features = [
  { icon: FileText, title: "City Papers", desc: "Step-by-step guides for Lisbon, Porto, and Algarve. First 90 days, neighborhood deep-dives, integration essentials." },
  { icon: Video, title: "Webinar Library", desc: "20+ on-demand webinars: NIF setup, tax residency, property buying, market analysis, renovation costs, and more." },
  { icon: BookOpen, title: "Partner Directory", desc: "50+ vetted professionals: lawyers, accountants, brokers, agents, movers, language schools." },
  { icon: Users, title: "Community", desc: "Monthly calls, WhatsApp groups, networking events. Connect with other internationals building abroad." },
  { icon: Calculator, title: "Deal Calculators", desc: "Real cost breakdowns: acquisition, renovation, holding costs. Know exactly what you need." },
  { icon: CheckSquare, title: "Templates & Checklists", desc: "Moving checklists, document templates, negotiation scripts, renovation budgets." },
  { icon: MapPin, title: "Neighborhood Intel", desc: "Insider info on where to live: price trends, lifestyle fit, transport, schools." },
  { icon: Percent, title: "Exclusive Discounts", desc: "Save 10–20% on partner services. Language courses, legal fees, moving." },
];

export function PlatformSection() {
  return (
    <section id="platform" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <TextReveal
            as="h2"
            className="font-serif text-4xl font-semibold text-foreground sm:text-5xl"
          >
            Inside the Platform
          </TextReveal>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Everything you need to go from arrival to ownership, all in one place.
            </p>
          </FadeUp>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.06}>
              <div className="group rounded-lg border border-border/40 bg-card/30 p-6 transition-colors hover:border-primary/20 hover:bg-card/60">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
