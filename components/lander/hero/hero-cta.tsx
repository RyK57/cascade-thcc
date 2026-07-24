import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { HERO } from "./hero-data";

interface HeroCtaProps {
  className?: string;
}

export function HeroCta({ className }: HeroCtaProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="xl" asChild>
          <Link href={ROUTES.main}>
            {HERO.primaryCta}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild>
          <Link href="#how-it-works">{HERO.secondaryCta}</Link>
        </Button>
      </div>
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheck
          aria-hidden
          className="mt-px size-4 shrink-0 text-accent-ink"
        />
        {HERO.trust}
      </p>
    </div>
  );
}
