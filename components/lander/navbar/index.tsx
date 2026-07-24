import { LanderShell } from "@/components/lander/shell";
import { NavbarActions, NavbarLinks } from "./navbar-links";
import { NavbarLogo } from "./navbar-logo";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <LanderShell className="flex h-16 items-center justify-between gap-4 border-b border-hairline/60">
        <NavbarLogo />
        <NavbarLinks />
        <NavbarActions />
      </LanderShell>
    </header>
  );
}
