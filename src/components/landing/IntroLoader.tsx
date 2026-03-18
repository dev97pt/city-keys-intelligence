import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "tunnel" | "done">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("tunnel"), 1800);
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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* The keyhole door — dark surface rushing toward viewer */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={
              phase === "tunnel"
                ? { scale: 18, z: 500 }
                : { scale: 1, z: 0 }
            }
            transition={
              phase === "tunnel"
                ? { duration: 1.4, ease: [0.45, 0, 0.15, 1] }
                : { duration: 0 }
            }
            style={{
              transformStyle: "preserve-3d",
              perspective: "800px",
              willChange: "transform",
            }}
          >
            {/* Dark door surface with keyhole cutout */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <mask id="keyhole-door-mask">
                  <rect width="1000" height="1000" fill="white" />
                  {/* Keyhole cutout — black = transparent */}
                  <circle cx="500" cy="420" r="55" fill="black" />
                  <path
                    d="M478,460 L465,570 Q463,585 478,585 L522,585 Q537,585 535,570 L522,460 Z"
                    fill="black"
                  />
                </mask>
                {/* Glow filter for the keyhole edge */}
                <filter id="keyhole-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                </filter>
              </defs>

              {/* Dark door */}
              <rect
                width="1000"
                height="1000"
                fill="hsl(var(--background))"
                mask="url(#keyhole-door-mask)"
              />

              {/* Golden glow around keyhole edge */}
              <g filter="url(#keyhole-glow)" opacity="0.35">
                <circle cx="500" cy="420" r="57" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
                <path
                  d="M478,460 L465,570 Q463,585 478,585 L522,585 Q537,585 535,570 L522,460 Z"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                />
              </g>
            </svg>
          </motion.div>

          {/* Text overlay — fades out when tunnel starts */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            animate={
              phase === "tunnel"
                ? { opacity: 0, scale: 0.8 }
                : { opacity: 1, scale: 1 }
            }
            transition={
              phase === "tunnel"
                ? { duration: 0.4, ease: "easeIn" }
                : { duration: 0 }
            }
          >
            {["From Arrival", "to Ownership"].map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: 0.7,
                    delay: 0.3 + i * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl"
                >
                  {line}
                </motion.div>
              </div>
            ))}

            {/* Gold key icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="18" y1="10" x2="18" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="21" y1="10" x2="21" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Vignette ring — depth illusion of tunnel walls */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={
              phase === "tunnel"
                ? { opacity: 0 }
                : { opacity: 1 }
            }
            transition={{ duration: 0.6 }}
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 75%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
