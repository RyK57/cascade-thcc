import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NAV_LINKS } from "@/components/lander/navbar/nav-data";
import { FOCUS_RING, LanderShell } from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = [...NAV_LINKS, { href: ROUTES.main, label: "App" }];

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <LanderShell>
        <div className="flex flex-col gap-10 py-16 md:py-20 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:py-24">
          <p className="max-w-[19ch] font-secondary text-[clamp(2rem,4vw,3.25rem)] leading-[1.0] text-balance text-foreground">
            {BRAND.tagline}
          </p>
          <Button size="xl" className="self-start lg:self-auto" asChild>
            <Link href={ROUTES.main}>
              Open the app
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline py-6 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Footer" className="-mx-3">
            <ul className="flex flex-wrap items-center">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      FOCUS_RING
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="px-3 text-sm text-muted-foreground sm:px-0">
            {BRAND.name} © {new Date().getFullYear()}
          </p>
        </div>
      </LanderShell>
    </footer>
  );
}
