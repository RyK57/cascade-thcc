import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AUTH_COPY, mapAuthError } from "@/components/auth/auth-copy";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: AUTH_COPY.error.metaTitle,
};

interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;

  // `message` arrives from the OAuth callback as raw provider text — and from
  // the query string, so it is untrusted besides. Only mapped copy is rendered.
  const { message: explanation, action } = mapAuthError(message, "callback");

  return (
    <AuthCard title={AUTH_COPY.error.title} description={explanation}>
      <div className="space-y-3">
        <Button size="lg" className="w-full" asChild>
          <Link href={action?.href ?? ROUTES.auth.login}>
            {action?.label ?? "Back to sign in"}
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="w-full" asChild>
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
