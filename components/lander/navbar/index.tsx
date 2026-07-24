import { NavbarActions, NavbarLinks } from "./navbar-links";
import { NavbarLogo } from "./navbar-logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavbarLogo />
        <NavbarLinks />
        <NavbarActions />
      </div>
    </header>
  );
}
