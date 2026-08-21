import { TextReveal, FadeUp } from "./ScrollReveal";

export function ProblemSection() {
  return (
    <section id="challenge" className="scroll-mt-20 px-6 py-24">
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
      </div>
    </section>
  );
}
