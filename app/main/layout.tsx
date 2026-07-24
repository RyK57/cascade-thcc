import { DashboardShell } from "@/components/app/dashboard-shell";
import { isInternalOperator } from "@/libs/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * `getUserId` in `utils/supabase/session` only returns the UUID, and a UUID is
 * not an identity anyone recognises. Read the verified user directly so the
 * chrome can show the address the person signed in with.
 */
async function getSignedInEmail(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getSignedInEmail();
  const showInternal = isInternalOperator(email);

  return (
    <DashboardShell email={email} showInternal={showInternal}>
      {children}
    </DashboardShell>
  );
}
