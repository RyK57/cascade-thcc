import Link from "next/link";
import { LanderShell } from "@/components/lander/shell";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";

export function Footer() {
  return (
    <footer className="border-t border-hairline py-10">
      <LanderShell className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-secondary text-2xl text-foreground">{BRAND.name}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link href="#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="#stack" className="hover:text-foreground">
            Stack
          </Link>
          <Link href={ROUTES.main} className="hover:text-foreground">
            App
          </Link>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </LanderShell>
    </footer>
  );
}
