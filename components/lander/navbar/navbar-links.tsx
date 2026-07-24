import Link from "next/link";
import { FOCUS_RING } from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-data";

/**
 * Desktop section nav. Below `md` the same links live in the mobile
 * disclosure, so hiding this is never the only path to them.
 */
export function NavbarLinks() {
  return (
    <nav aria-label="Page sections" className="hidden md:block">
      <ul className="-mx-3 flex items-center">
        {NAV_LINKS.map((link) => (
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
  );
}

export function NavbarActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        asChild
      >
        <Link href={ROUTES.auth.login}>Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href={ROUTES.main}>Open app</Link>
      </Button>
    </div>
  );
}
