import { motion } from "framer-motion";

export function FounderSection() {
  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg border border-border/50 bg-card/50 p-10 md:p-14"
        >
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Built by Someone Who's Been There
          </h2>
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
            <p className="text-foreground font-medium">
              Keys to the City is the network I wish I had when I started. Now it's yours.
            </p>
          </div>
          <div className="mt-8 border-t border-border/50 pt-6">
            <p className="text-sm font-medium text-primary">Ismael Fernandes</p>
            <p className="text-xs text-muted-foreground">Founder, Keys to the City</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
