import { LanderShell } from "@/components/lander/shell";
import { NavbarActions, NavbarLinks } from "./navbar-links";
import { NavbarLogo } from "./navbar-logo";
import { NavbarMobile } from "./navbar-mobile";

/**
 * Title block for the sheet: solid, hairline-ruled, and sticky so the section
 * links stay reachable through a long scroll.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background">
      <LanderShell className="flex h-14 items-center justify-between gap-4 md:h-16">
        <NavbarLogo />
        <NavbarLinks />
        <div className="flex items-center gap-2">
          <NavbarActions />
          <NavbarMobile />
        </div>
      </LanderShell>
    </header>
  );
}
