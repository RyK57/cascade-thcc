import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { ROUTES } from "@/lib/constants/routes";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#stack", label: "Stack" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export function NavbarLinks() {
  return (
    <nav className="hidden items-center gap-7 md:flex">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function NavbarActions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.auth.login}>Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href={ROUTES.main}>Open app</Link>
      </Button>
    </div>
  );
}
