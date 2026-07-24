"use client";

import { Accordion } from "radix-ui";
import { Plus } from "lucide-react";
import { FOCUS_RING } from "@/components/lander/shell";
import { cn } from "@/lib/utils";
import type { FaqItem } from "./faq-data";

interface FaqAccordionProps {
  items: readonly FaqItem[];
}

/**
 * Progressive disclosure instead of five permanently open answers. Radix wires
 * the button/region relationship, `aria-expanded`, and arrow-key roving;
 * `Accordion.Header` renders the one `h3` each question is entitled to.
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={items[0]?.question}
      className="border-t border-hairline"
    >
      {items.map((item) => (
        <Accordion.Item
          key={item.question}
          value={item.question}
          className="border-b border-hairline"
        >
          <Accordion.Header className="font-primary">
            <Accordion.Trigger
              className={cn(
                "group flex w-full items-center justify-between gap-6 rounded-sm py-6 text-left",
                FOCUS_RING
              )}
            >
              <span className="text-[1.0625rem] font-medium leading-snug text-foreground transition-colors group-hover:text-accent-ink group-data-[state=open]:text-accent-ink sm:text-xl">
                {item.question}
              </span>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline text-muted-foreground transition-[transform,color,border-color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-foreground group-data-[state=open]:rotate-45 group-data-[state=open]:border-brand-accent-bright/45 group-data-[state=open]:text-accent-ink"
              >
                <Plus className="size-4" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="overflow-hidden duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="max-w-[68ch] pb-8 pr-14 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
              {item.answer}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
