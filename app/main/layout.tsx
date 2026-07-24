import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { isInternalOperator } from "@/libs/auth";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";
import { signOutAction } from "@/libs/auth/sign-out";
import { createClient } from "@/utils/supabase/server";

/**
 * `getUserId` in `utils/supabase/session` only returns the UUID, and a UUID is
 * not an identity anyone recognises. Read the verified user directly so the
 * header can show the address the person signed in with.
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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-hairline">
        <AppShell className="flex h-16 items-center justify-between gap-4">
          <Link
            href={ROUTES.main}
            className="flex shrink-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${BRAND.name} — workspace`}
          >
            <Image src="/logo.png" alt="" width={22} height={22} />
            <span className="hidden font-secondary text-lg leading-none sm:inline">
              Workspace
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {email ? (
              <p
                title={email}
                className="min-w-0 truncate text-sm text-muted-foreground"
              >
                <span className="sr-only">Signed in as </span>
                {email}
              </p>
            ) : null}
            {showInternal ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.internal}>Internal</Link>
              </Button>
            ) : null}
            <form action={signOutAction} className="shrink-0">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </AppShell>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
