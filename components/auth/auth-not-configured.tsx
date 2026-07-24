import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Shown when the deployment has no Supabase credentials. It still carries the
 * page's <h1> — a route with no heading is unnavigable by screen reader, and
 * that is no less true on the failure path.
 */
export function AuthNotConfigured() {
  return (
    <AuthCard
      title={AUTH_COPY.notConfigured.title}
      description={AUTH_COPY.notConfigured.description}
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign-in can’t be completed here right now. Nothing you enter would be
          saved. Try again later, or head back home.
        </p>
        <Button size="lg" variant="outline" className="w-full" asChild>
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
