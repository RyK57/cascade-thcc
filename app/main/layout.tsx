import { DashboardShell } from "@/components/app/dashboard-shell";
import { AccountSignOut } from "@/components/app/main/account-sign-out";
import { Button } from "@/components/ui/button";
import { getAccountSession } from "@/libs/account";
import { isInternalOperator } from "@/libs/auth";
import { signOutAction } from "@/libs/auth/sign-out";
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
  const [email, accountSession] = await Promise.all([
    getSignedInEmail(),
    getAccountSession().catch(() => null),
  ]);
  const showInternal = isInternalOperator(email);
  // Two doors into the same chrome. A phone-verified customer sees the number
  // their thread runs on; an operator sees the address they signed in with.
  const identityLabel = email ?? accountSession?.phone ?? null;

  const signOut = email ? (
    <form action={signOutAction}>
      <Button variant="outline" size="sm" type="submit" className="w-full md:w-auto">
        Sign out
      </Button>
    </form>
  ) : accountSession ? (
    <AccountSignOut />
  ) : null;

  return (
    <DashboardShell
      identityLabel={identityLabel}
      showInternal={showInternal}
      signOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}
