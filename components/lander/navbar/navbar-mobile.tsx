"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { FOCUS_RING } from "@/components/lander/shell";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-data";

/**
 * Below `md` the section links live here instead of being display:none with no
 * fallback. Radix supplies the focus trap, Esc dismissal, scroll lock and
 * `aria-expanded` wiring; the sheet itself stays on the drafting grid.
 */
export function NavbarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
          onOpenAutoFocus={(event) => {
            // Land on the sheet itself, not the first link, so the whole
            // list is announced before anything is chosen.
            event.preventDefault();
            (event.currentTarget as HTMLElement).focus();
          }}
          tabIndex={-1}
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Jump to a section of this page, sign in, or open the app.
          </Dialog.Description>

          <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-[var(--spacing-gutter)]">
            <span className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full"
              />
              <span className="font-secondary text-xl text-foreground">
                {BRAND.name}
              </span>
            </span>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="-mr-2"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <nav
            aria-label="Page sections"
            className="flex-1 overflow-y-auto overscroll-contain px-[var(--spacing-gutter)]"
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="border-b border-hairline">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex min-h-16 items-center justify-between gap-4 py-5 font-secondary text-[1.75rem] leading-none text-foreground transition-colors hover:text-accent-ink",
                      FOCUS_RING
                    )}
                  >
                    {link.label}
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="shrink-0 space-y-3 border-t border-hairline p-[var(--spacing-gutter)] pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))]">
            <Button size="xl" className="w-full" asChild>
              <Link href={ROUTES.main} onClick={() => setOpen(false)}>
                Open the app
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="w-full" asChild>
              <Link href={ROUTES.auth.login} onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
              {BRAND.tagline}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
