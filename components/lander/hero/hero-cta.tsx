"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { HERO } from "./hero-data";

export function HeroCta() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-3 sm:flex-row"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: reduceMotion ? 0 : 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Button size="xl" asChild>
        <Link href={ROUTES.main}>
          {HERO.primaryCta}
          <ArrowRight data-icon="inline-end" className="size-4" />
        </Link>
      </Button>
      <Button size="xl" variant="outline" asChild>
        <Link href="#how-it-works">{HERO.secondaryCta}</Link>
      </Button>
    </motion.div>
  );
}
