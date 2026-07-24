import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroVisual } from "@/components/lander/hero/hero-visual";
import { LanderLabel, LanderSection, LanderShell } from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS, HOW_IT_WORKS_STEPS } from "./how-it-works-data";
import { HowItWorksStepRow } from "./how-it-works-step";

export function HowItWorksSection() {
  return (
    <LanderSection id="how-it-works">
      <LanderShell>
        <div className="grid gap-10 border border-hairline lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between gap-10 p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <LanderLabel bracketed>{HOW_IT_WORKS.label}</LanderLabel>
              <h2 className="max-w-md font-secondary text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                {HOW_IT_WORKS.headline}
              </h2>
              <Button size="lg" variant="outline" asChild>
                <Link href={HOW_IT_WORKS.ctaHref}>
                  {HOW_IT_WORKS.cta}
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-4 border-t border-hairline pt-6">
              {HOW_IT_WORKS_STEPS.map((item) => (
                <HowItWorksStepRow key={item.step} item={item} />
              ))}
            </ul>
          </div>
          <div className="border-t border-hairline lg:border-l lg:border-t-0">
            <HeroVisual />
          </div>
        </div>
      </LanderShell>
    </LanderSection>
  );
}
