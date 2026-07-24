import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";

const EXITS = [
  { href: ROUTES.home, label: "Home" },
  { href: `${ROUTES.home}#how-it-works`, label: "How it works" },
  { href: ROUTES.main, label: "Workspace" },
] as const;

interface StatusPageProps {
  /** Short technical marker — "404", "Error". */
  marker: string;
  title: string;
  description: string;
  /** Primary and secondary buttons. */
  actions: React.ReactNode;
  /** Optional small print, e.g. an error digest an operator can quote. */
  footnote?: React.ReactNode;
}

/**
 * Shared chrome for the routes that are reached by accident — 404 and the
 * error boundary. Both keep the product's header and footer so they read as
 * part of the app rather than a browser default, and both offer more than one
 * way out.
 *
 * No "use client" on purpose: `not-found.tsx` renders this on the server,
 * `error.tsx` pulls it into its own client boundary.
 */
export function StatusPage({
  marker,
  title,
  description,
  actions,
  footnote,
}: StatusPageProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-hairline">
        <AppShell className="flex h-16 items-center">
          {/* Same mark and wordmark as the lander navbar and the auth header:
              28px circular mark, tracked caps, 44px hit area pulled back to the
              gutter. Three surfaces, one logo. */}
          <Link
            href={ROUTES.home}
            aria-label={`${BRAND.name} — home`}
            className="group -ml-2 inline-flex min-h-11 items-center gap-3 rounded-full pr-3 pl-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full"
            />
            <span className="label-caps text-muted-foreground transition-colors group-hover:text-foreground">
              {BRAND.name}
            </span>
          </Link>
        </AppShell>
      </header>

      <main id="main-content" className="flex flex-1 items-center rules-x">
        <AppShell className="py-20 sm:py-28">
          <div className="max-w-[54ch]">
            <p className="label-caps text-accent-ink">{marker}</p>
            <h1 className="mt-6 font-secondary text-4xl sm:text-5xl">{title}</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
            {footnote ? (
              <div className="mt-8 border-t border-hairline pt-4 text-xs text-muted-foreground">
                {footnote}
              </div>
            ) : null}
          </div>
        </AppShell>
      </main>

      <footer className="border-t border-hairline py-8">
        <AppShell className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-sm text-muted-foreground">
            {BRAND.tagline}
          </p>
          <nav aria-label="Other places to go">
            <ul className="-mx-3 flex flex-wrap text-sm text-muted-foreground">
              {EXITS.map((exit) => (
                <li key={exit.label}>
                  <Link
                    href={exit.href}
                    className="inline-flex min-h-11 items-center rounded-full px-3 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {exit.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </AppShell>
      </footer>
    </div>
  );
}
