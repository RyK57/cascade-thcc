import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  LanderSection,
  LanderShell,
  SectionHead,
} from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import {
  CONFIRM_GATE,
  HOW_IT_WORKS,
  HOW_IT_WORKS_STEPS,
} from "./how-it-works-data";
import { HowItWorksStepRow } from "./how-it-works-step";

export function HowItWorksSection() {
  return (
    <LanderSection id="how-it-works">
      <LanderShell>
        <SectionHead
          title={HOW_IT_WORKS.headline}
          support={HOW_IT_WORKS.support}
          action={
            <Button size="lg" variant="outline" asChild>
              <Link href={HOW_IT_WORKS.ctaHref}>
                {HOW_IT_WORKS.cta}
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-14 md:mt-20 lg:mt-24">
          {/* The wire: one continuous accent rule with a tick where each move
              begins. It carries the sequence so the cells don't need numerals. */}
          <div
            aria-hidden
            className="relative hidden h-px bg-brand-accent-bright/45 lg:block"
          >
            {[0, 1, 2].map((tick) => (
              <span
                key={tick}
                style={{ left: `${(tick / 3) * 100}%` }}
                className="absolute bottom-0 h-2 w-px bg-brand-accent-bright"
              />
            ))}
          </div>

          <div className="border border-hairline lg:border-t-0">
            <ol className="grid lg:grid-cols-3">
              {HOW_IT_WORKS_STEPS.map((item) => (
                <HowItWorksStepRow
                  key={item.step}
                  item={item}
                  system={item.system}
                />
              ))}
            </ol>

            <div className="grid gap-5 border-t border-hairline bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-10">
              <p className="max-w-[15ch] font-secondary text-[clamp(1.625rem,2.8vw,2.5rem)] leading-[1.02] text-balance text-accent-ink">
                {CONFIRM_GATE.headline}
              </p>
              <p className="max-w-[56ch] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
                {CONFIRM_GATE.description}
              </p>
            </div>
          </div>
        </div>
      </LanderShell>
    </LanderSection>
  );
}
