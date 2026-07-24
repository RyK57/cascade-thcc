import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { signOutAction } from "@/libs/auth/sign-out";
import { getUserId } from "@/utils/supabase/session";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href={ROUTES.main} className="font-secondary text-lg">
            Workspace
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.internal}>Internal</Link>
            </Button>
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        {userId ? (
          <p className="mx-auto mt-2 w-full max-w-6xl text-xs text-muted-foreground">
            Signed in as {userId}
          </p>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
