import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"text" | "exit">("text");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), 2400);
    const t2 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  const lines = ["From Arrival", "to Ownership"];

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        initial={{ y: 0 }}
        animate={phase === "exit" ? { y: "-100%" } : { y: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (phase === "exit") onComplete();
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {lines.map((line, i) => (
            <div key={i} className="overflow-hidden">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="font-serif text-4xl font-semibold text-foreground sm:text-6xl md:text-7xl"
              >
                {line}
              </motion.div>
            </div>
          ))}

          {/* Accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 h-[2px] w-24 origin-left bg-primary"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
