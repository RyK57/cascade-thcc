import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { isInternalOperator } from "@/libs/auth";
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
  const email = supabase
    ? (await supabase.auth.getUser()).data.user?.email
    : null;

  if (!isInternalOperator(email)) notFound();

  return (
    <DashboardShell email={email ?? null} showInternal>
      {children}
    </DashboardShell>
  );
}
