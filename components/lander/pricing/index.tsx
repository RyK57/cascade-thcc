import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  LanderSection,
  LanderShell,
  SectionHead,
} from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { PRICING } from "./pricing-data";

/**
 * A rate sheet, not three matching cards: term on the left, the terms of the
 * deal on the right, hairline-ruled the way the rest of the sheet is.
 */
export function PricingSection() {
  return (
    <LanderSection id="pricing" rules>
      <LanderShell>
        <SectionHead
          title={PRICING.headline}
          support={PRICING.support}
          action={
            <Button size="xl" asChild>
              <Link href={ROUTES.main}>
                {PRICING.cta}
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
          }
        />

        <ul className="mt-14 border-t border-hairline md:mt-20 lg:mt-24">
          {PRICING.points.map((point) => (
            <li
              key={point.title}
              className="grid gap-3 border-b border-hairline py-7 md:grid-cols-2 md:items-baseline md:gap-12 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-16 lg:py-12"
            >
              <h3 className="max-w-[14ch] font-secondary text-[clamp(1.5rem,2.3vw,2.125rem)] leading-[1.05] text-balance text-foreground">
                {point.title}
              </h3>
              <p className="max-w-[62ch] text-sm leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                {point.description}
              </p>
            </li>
          ))}
        </ul>
      </LanderShell>
    </LanderSection>
  );
}
