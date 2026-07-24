"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/libs/auth/sign-out";

interface DashboardShellProps {
  email: string | null;
  showInternal: boolean;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
}

function buildNav(showInternal: boolean): NavItem[] {
  const items: NavItem[] = [
    {
      href: ROUTES.main,
      label: "Overview",
      icon: LayoutDashboard,
      match: (pathname) =>
        pathname === ROUTES.main || pathname.startsWith(`${ROUTES.main}/`),
    },
  ];

  if (showInternal) {
    items.push({
      href: ROUTES.internal,
      label: "Internal",
      icon: Wrench,
      match: (pathname) => pathname.startsWith(ROUTES.internal),
    });
  }

  return items;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

/**
 * Signed-in app chrome: persistent sidebar + dense content frame.
 * Replaces the lander-style single-column header used previously on `/main`.
 */
export function DashboardShell({
  email,
  showInternal,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = buildNav(showInternal);

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2.5 px-4">
          <Image src="/logo.png" alt="" width={22} height={22} />
          <span className="font-secondary text-base leading-none">
            {BRAND.name}
          </span>
        </div>
        <Separator />
        <nav aria-label="Workspace" className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.match(pathname)}
            />
          ))}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border p-3">
          {email ? (
            <p
              title={email}
              className="truncate px-1 text-xs text-muted-foreground"
            >
              <span className="sr-only">Signed in as </span>
              {email}
            </p>
          ) : null}
          <form action={signOutAction}>
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-hairline px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-workspace-nav"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
              <span className="sr-only">Toggle navigation</span>
            </Button>
            <Link
              href={ROUTES.main}
              className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image src="/logo.png" alt="" width={20} height={20} />
              <span className="truncate font-secondary text-base">
                {BRAND.name}
              </span>
            </Link>
          </div>

          <p className="hidden text-sm text-muted-foreground md:block">
            Operator workspace
          </p>

          <div className="flex min-w-0 items-center gap-2">
            {email ? (
              <p
                title={email}
                className="hidden max-w-[14rem] truncate text-sm text-muted-foreground sm:block md:hidden"
              >
                {email}
              </p>
            ) : null}
            <form action={signOutAction} className="md:hidden">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        {mobileOpen ? (
          <nav
            id="mobile-workspace-nav"
            aria-label="Workspace"
            className="space-y-1 border-b border-hairline bg-sidebar p-3 md:hidden"
          >
            {nav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={item.match(pathname)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        ) : null}

        <main id="main-content" className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
