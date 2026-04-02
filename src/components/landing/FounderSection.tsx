import { TextReveal, FadeUp, LineReveal } from "./ScrollReveal";
import founderImg from "@/assets/ismael-founder.png";

export function FounderSection() {
  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            {/* Text side */}
            <div>
              <TextReveal
                as="h2"
                className="font-serif text-3xl font-semibold text-foreground sm:text-4xl"
              >
                Built by Someone Who's Been There
              </TextReveal>

              <LineReveal className="mt-6 w-24" delay={0.2} />

              <FadeUp delay={0.3}>
                <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    I'm Ismael. Born in Portugal, raised in Guinea-Bissau, moved back at 12. I know what it's like to start over.
                  </p>
                  <p>
                    Started in real estate in 2020 doing 100 cold calls a day and door knocking for 2 hours straight. Every. Single. Day. Worked the worst properties first — rat-infested buildings, family disputes, abandoned apartments.
                  </p>
                  <p>
                    That taught me more than any luxury deal ever could. If you can solve problems on €100k properties, you can handle anything.
                  </p>
                  <p>
                    Found my passion helping people with similar stories to mine — 80% of my clients are from African descent. Not by design, but because I understand what it means to move, adapt, and build in a new place.
                  </p>
                  <p className="text-primary font-medium italic">
                    Keys to the City is the network I wish I had when I started. Now it's yours.
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Image side */}
            <FadeUp delay={0.4}>
              <div className="flex flex-col items-center">
                <div className="overflow-hidden rounded-xl border border-primary/20 bg-[hsl(220_30%_14%)]">
                  <img
                    src={founderImg}
                    alt="Ismael Gomes Queta — Founder of Keys to the City"
                    className="h-auto w-full max-w-md object-cover"
                  />
                </div>
                <div className="mt-6 text-center">
                  <p className="font-serif text-xl font-semibold text-foreground">Ismael Gomes Queta</p>
                  <p className="text-sm text-muted-foreground">Founder, Keys to the City</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
