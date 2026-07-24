import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LanderLabel, LanderSection, LanderShell } from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { PRICING } from "./pricing-data";

export function PricingSection() {
  return (
    <LanderSection id="pricing" rules>
      <LanderShell>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-2xl space-y-5">
            <LanderLabel bracketed>Pricing</LanderLabel>
            <h2 className="font-secondary text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              {PRICING.headline}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {PRICING.support}
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Button size="xl" asChild>
              <Link href={ROUTES.main}>
                {PRICING.cta}
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid border border-hairline md:grid-cols-3">
          {PRICING.points.map((point) => (
            <div
              key={point.title}
              className="space-y-3 border-b border-hairline p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-8"
            >
              <h3 className="text-lg font-medium tracking-tight">{point.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </LanderShell>
    </LanderSection>
  );
}
