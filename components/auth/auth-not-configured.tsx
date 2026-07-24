import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export function AuthNotConfigured() {
  return (
    <Alert>
      <AlertTitle>Supabase not configured</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Auth pages load without keys. Add Supabase env vars to enable sign-in,
          sign-up, and password flows.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
