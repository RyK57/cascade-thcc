"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LanderLabel } from "@/components/lander/shell";
import { cn } from "@/lib/utils";
import { HERO_THREAD, THREAD, THREAD_SPEAKERS } from "./hero-data";

/** Exponential ease-out — the page's single motion curve. */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ThreadPanelProps {
  className?: string;
}

/**
 * The product, rendered. This is the one authored motion moment on the page:
 * the thread settles into place once, on mount.
 *
 * The bubbles never drop below full opacity, so a no-scroll capture — OG image,
 * print, crawler, reduced motion — always shows real, readable copy. Motion is
 * added on top of an already-visible default, never used to reveal it.
 */
export function ThreadPanel({ className }: ThreadPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative isolate flex min-h-[24rem] flex-col overflow-hidden border border-hairline bg-surface-deep",
        className
      )}
    >
      {/* Mesh stays crisp where the thread is empty and is masked back behind
          the messages, so the panel reads as lit from the top edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rules-mesh [mask-image:linear-gradient(to_bottom,#000_0%,#000_14%,rgba(0,0,0,0.26)_58%,rgba(0,0,0,0.5)_100%)]"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(ellipse_70%_100%_at_62%_0%,color-mix(in_oklab,var(--brand-accent)_50%,transparent),transparent_72%)]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* Wraps as whole units at the narrowest widths rather than breaking the
          bracketed label across two lines. */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-hairline px-5 py-4 sm:px-6">
        <LanderLabel bracketed className="whitespace-nowrap">
          {THREAD.channel}
        </LanderLabel>
        <span className="label-caps flex items-center gap-2 whitespace-nowrap text-accent-ink">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-brand-accent-bright shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand-accent-bright)_22%,transparent)]"
          />
          {THREAD.agent}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end gap-5 px-5 py-6 sm:px-6 sm:py-7">
        <p className="label-caps text-center text-muted-foreground">
          {THREAD.stamp}
        </p>

        <ol className="flex flex-col gap-2.5">
          {HERO_THREAD.map((message, index) => {
            const isUser = message.from === "user";
            return (
              <motion.li
                key={`${message.from}-${index}`}
                className={cn(
                  "flex max-w-[86%] text-[0.9375rem] leading-relaxed",
                  isUser ? "self-end justify-end" : "self-start justify-start"
                )}
                initial={reduceMotion ? false : { y: 12, scale: 0.985 }}
                animate={{ y: 0, scale: 1 }}
                transition={{
                  duration: 0.75,
                  delay: reduceMotion ? 0 : 0.12 + index * 0.11,
                  ease: EASE,
                }}
              >
                <span className="sr-only">
                  {THREAD_SPEAKERS[message.from]}:{" "}
                </span>
                <span
                  className={cn(
                    "inline-block px-4 py-2.5",
                    isUser
                      ? "rounded-2xl rounded-br-sm bg-brand-accent text-brand-accent-foreground"
                      : "rounded-2xl rounded-bl-sm border border-hairline bg-foreground/10 text-foreground"
                  )}
                >
                  {message.text}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <ul className="relative grid grid-cols-3 border-t border-hairline">
        {THREAD.notes.map((note) => (
          <li
            key={note}
            className="label-caps border-l border-hairline px-2 py-3.5 text-center text-muted-foreground first:border-l-0"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
