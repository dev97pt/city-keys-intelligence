import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"reveal" | "expand" | "done">("reveal");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("expand"), 2000);
    const t2 = setTimeout(() => setPhase("done"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (phase === "done") onComplete();
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark overlay with keyhole cutout using SVG mask */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "hsl(var(--background))" }}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <mask id="keyhole-mask">
                  {/* White = visible (dark overlay shows), Black = hidden (content peeks through) */}
                  <rect width="1000" height="1000" fill="white" />
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={
                      phase === "expand"
                        ? { scale: 25, opacity: 1 }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={
                      phase === "expand"
                        ? { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
                        : { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
                    }
                    style={{ transformOrigin: "500px 480px" }}
                  >
                    {/* Keyhole shape: circle on top + trapezoid/rect on bottom */}
                    <circle cx="500" cy="440" r="60" fill="black" />
                    <path
                      d="M480,480 L470,560 Q470,570 480,570 L520,570 Q530,570 530,560 L520,480 Z"
                      fill="black"
                    />
                  </motion.g>
                </mask>
              </defs>
              <rect
                width="1000"
                height="1000"
                fill="hsl(var(--background))"
                mask="url(#keyhole-mask)"
              />
            </svg>
          </motion.div>

          {/* Text above keyhole */}
          <div className="relative z-10 flex flex-col items-center">
            {["From Arrival", "to Ownership"].map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={
                    phase === "expand"
                      ? { y: "-100%", opacity: 0 }
                      : { y: "0%" }
                  }
                  transition={
                    phase === "expand"
                      ? { duration: 0.5, ease: [0.76, 0, 0.24, 1] }
                      : { duration: 0.7, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl"
                >
                  {line}
                </motion.div>
              </div>
            ))}

            {/* Gold key icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                phase === "expand"
                  ? { opacity: 0, scale: 2 }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                phase === "expand"
                  ? { duration: 0.4 }
                  : { duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }
              }
              className="mt-6"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="18" y1="10" x2="18" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="21" y1="10" x2="21" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
