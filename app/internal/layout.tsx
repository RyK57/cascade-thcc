import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { isInternalOperator } from "@/components/app/internal/internal-access";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/utils/supabase/server";

/**
 * This subtree lists which secrets are configured, so signing in is not enough
 * to see it. Anyone who isn't an operator gets a 404 rather than a "forbidden",
 * which would confirm the route exists.
 *
 * Note: this gate covers the pages under `/internal`. Route handlers do not run
 * through layouts — if internal-only API routes are ever added, they need the
 * same check, ideally hoisted into `middleware.ts`.
 */
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const email = supabase ? (await supabase.auth.getUser()).data.user?.email : null;

  if (!isInternalOperator(email)) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-hairline">
        <AppShell className="flex h-16 items-center justify-between gap-4">
          <p className="label-caps text-accent-ink">Internal</p>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.main}>Back to workspace</Link>
          </Button>
        </AppShell>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
