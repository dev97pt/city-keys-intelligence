import { TextReveal, FadeUp, LineReveal, SloganWipe } from "./ScrollReveal";

export function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <TextReveal
          as="h2"
          className="font-serif text-4xl font-semibold text-foreground sm:text-5xl"
        >
          You've Made the Move.
        </TextReveal>
        <TextReveal
          as="h2"
          className="font-serif text-4xl font-semibold text-foreground sm:text-5xl"
          delay={0.1}
        >
          Now What?
        </TextReveal>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            You're settled in Portugal. NIF? Check. Bank account? Check. But the real moves — property, investment, building — still feel unclear.
          </p>
        </FadeUp>

        <LineReveal className="mx-auto mt-12 w-48" delay={0.3} />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Relocation",
              desc: "Google searches for professionals. Trial and error with expensive mistakes.",
            },
            {
              title: "Taxes & Legal",
              desc: "Conflicting advice everywhere. No clear roadmap or timeline.",
            },
            {
              title: "Property & Investment",
              desc: "Paying tourist prices for everything. No access to real insider knowledge.",
            },
          ].map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.12}>
              <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-left">
                <h3 className="font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Slogan wipe reveal — TREF-style */}
        <div className="mt-24">
          <SloganWipe
            lines={[
              "Stop wasting time, money, and",
              "energy figuring it out alone.",
              "Get the insider playbook.",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
