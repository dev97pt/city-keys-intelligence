import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

/**
 * Text slides up from below, similar to TREF .text-wrap > .text-inner pattern
 */
export function TextReveal({ children, className = "", delay = 0, as: Tag = "div" }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tag className={className}>{children}</Tag>
      </motion.div>
    </div>
  );
}

interface LineRevealProps {
  className?: string;
  delay?: number;
}

/**
 * Horizontal line that grows from left, like TREF .line-dash
 */
export function LineReveal({ className = "", delay = 0 }: LineRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`h-[1px] origin-left bg-border ${className}`}
      />
    </div>
  );
}

interface SloganWipeProps {
  lines: string[];
  className?: string;
}

/**
 * Text wipe reveal where accent-colored text is revealed line by line on scroll,
 * similar to TREF .slogan-line .slogan-cover pattern
 */
export function SloganWipe({ lines, className = "" }: SloganWipeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <div key={i} className="relative overflow-hidden">
          {/* Base text (muted) */}
          <span className="block font-serif text-2xl font-semibold text-muted-foreground/30 sm:text-3xl md:text-4xl leading-tight">
            {line}
          </span>
          {/* Reveal overlay (accent) */}
          <motion.span
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={isInView ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
            transition={{
              duration: 1.2,
              delay: i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 block font-serif text-2xl font-semibold text-primary sm:text-3xl md:text-4xl leading-tight"
          >
            {line}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Generic fade-up container for scroll reveal
 */
export function FadeUp({ children, className = "", delay = 0 }: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxFloatProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

/**
 * Parallax float effect on scroll, like TREF .img-float
 */
export function ParallaxFloat({ children, className = "", speed = 0.1 }: ParallaxFloatProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 0 }}
      whileInView={{ y: -30 * speed }}
      viewport={{ once: false, margin: "-20%" }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
