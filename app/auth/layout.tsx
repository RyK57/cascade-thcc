import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AUTH_LINK } from "@/components/auth/auth-styles";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  // Sign-in screens are not destinations; keeping them out of the index also
  // keeps them out of the "similar pages" carousels that phish people.
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      {/* The landing page's drafting field, at a fraction of its amplitude. It
          shows only in the margins around the panel — enough to place you in the
          same room, quiet enough that the task stays the loudest thing here. */}
      <div
        aria-hidden
        className="rules-x pointer-events-none absolute inset-0 [--rule-columns:6] opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_oklab,var(--brand-accent)_11%,transparent),transparent_70%)]"
      />

      <header className="relative z-10 border-b border-hairline">
        <div className="mx-auto flex w-full max-w-[var(--container-shell)] items-center px-[var(--spacing-gutter)] py-3">
          {/* 28px mark, 44px hit area — the navbar's treatment, same reasoning. */}
          <Link
            href={ROUTES.home}
            className={`${AUTH_LINK} group -ml-2 inline-flex min-h-11 items-center gap-3 rounded-full pr-3 pl-2 hover:no-underline`}
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              priority
              className="size-7 rounded-full"
            />
            <span className="label-caps text-muted-foreground transition-colors group-hover:text-foreground">
              {BRAND.name}
            </span>
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 flex flex-1 items-center justify-center px-[var(--spacing-gutter)] py-14 sm:py-20"
      >
        {children}
      </main>
    </div>
  );
}
