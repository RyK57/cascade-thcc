import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACCOUNT_DEFAULTS } from "@/libs/seed/demo-credentials";

export function InternalSeedPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo account seed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Run locally after Supabase admin env vars are set:</p>
        <code className="block rounded-md bg-muted px-3 py-2 text-xs text-foreground">
          pnpm db:seed
        </code>
        <p>
          Default email: <span className="text-foreground">{DEMO_ACCOUNT_DEFAULTS.email}</span>
        </p>
        <p>Override with DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD, DEMO_ACCOUNT_NAME.</p>
      </CardContent>
    </Card>
  );
}
