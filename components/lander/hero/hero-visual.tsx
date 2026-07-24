"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HERO_THREAD } from "./hero-data";

/** Thread panel used in the how-it-works split — not the hero */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden border border-hairline bg-surface-deep rules-mesh">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_20%,color-mix(in_oklab,var(--brand-accent)_22%,transparent),transparent_55%)]" />
      <div className="relative flex h-full flex-col justify-end gap-3 p-6 sm:p-8">
        <p className="label-caps mb-2 text-muted-foreground">
          [ Live on iMessage ]
        </p>
        {HERO_THREAD.map((message, index) => {
          const isUser = message.from === "user";
          return (
            <motion.div
              key={`${message.from}-${index}`}
              className={`max-w-[92%] text-sm leading-relaxed sm:text-[0.95rem] ${
                isUser ? "self-end text-right" : "self-start text-left"
              }`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.4,
                delay: reduceMotion ? 0 : index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span
                className={`inline-block px-4 py-3 ${
                  isUser
                    ? "rounded-2xl rounded-br-md bg-brand-accent text-brand-accent-foreground"
                    : "rounded-2xl rounded-bl-md bg-foreground/10 text-foreground"
                }`}
              >
                {message.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
