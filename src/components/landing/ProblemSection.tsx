import { motion } from "framer-motion";

export function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-serif text-4xl font-semibold text-foreground sm:text-5xl"
        >
          You've Made the Move.<br />Now What?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-muted-foreground leading-relaxed"
        >
          You're settled in Portugal. NIF? Check. Bank account? Check. But the real moves — property, investment, building — still feel unclear.
        </motion.p>

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
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-lg border border-border/50 bg-card/50 p-6 text-left"
            >
              <h3 className="font-serif text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
