import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

interface AuthErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;

  return (
    <AuthCard
      title="Authentication error"
      description="We could not complete your sign-in request."
    >
      <p className="mb-6 text-sm text-muted-foreground">
        {message ?? "The auth link may be expired or invalid. Try signing in again."}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={ROUTES.auth.login}>Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.home}>Home</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
