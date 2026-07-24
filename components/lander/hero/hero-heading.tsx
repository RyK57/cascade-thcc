"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HERO } from "./hero-data";

export function HeroHeading() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-6 text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="font-secondary text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
        {HERO.headlineLead}{" "}
        <span className="text-brand-accent">{HERO.headlineAccent}</span>
      </h1>
      <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {HERO.support}
      </p>
    </motion.div>
  );
}
