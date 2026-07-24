import { AppShell } from "@/components/app/app-shell";

/**
 * A spinner reserves no space, so every navigation used to reflow twice. This
 * holds the shape every route in the app shares — a 4rem header rule, an
 * eyebrow, a display heading, a paragraph, then a panel — so the real page
 * arrives into a layout that already exists.
 */
export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <span className="sr-only" role="status">
        Loading
      </span>

      <div aria-hidden className="border-b border-hairline">
        <AppShell className="flex h-16 items-center justify-between gap-4">
          <div className="h-5 w-32 animate-pulse rounded-sm bg-foreground/10" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-40 animate-pulse rounded-sm bg-foreground/10" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-foreground/10" />
          </div>
        </AppShell>
      </div>

      <AppShell className="flex-1 py-12 sm:py-16">
        <div aria-hidden className="max-w-[58ch] space-y-4">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-foreground/10" />
          <div className="h-11 w-full animate-pulse rounded-sm bg-foreground/10" />
          <div className="h-11 w-3/5 animate-pulse rounded-sm bg-foreground/10" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse rounded-sm bg-foreground/10" />
            <div className="h-4 w-11/12 animate-pulse rounded-sm bg-foreground/10" />
            <div className="h-4 w-4/6 animate-pulse rounded-sm bg-foreground/10" />
          </div>
        </div>

        <div
          aria-hidden
          className="mt-12 h-56 animate-pulse rounded-xl border border-hairline bg-foreground/[0.03]"
        />

        <div aria-hidden className="mt-16 max-w-3xl space-y-px">
          <div className="h-16 animate-pulse rounded-sm bg-foreground/[0.04]" />
          <div className="h-16 animate-pulse rounded-sm bg-foreground/[0.04]" />
          <div className="h-16 animate-pulse rounded-sm bg-foreground/[0.04]" />
        </div>
      </AppShell>
    </div>
  );
}
