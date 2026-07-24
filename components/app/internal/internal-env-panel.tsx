import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LINQ_API_V3_API_KEY",
  "TERAC_API_KEY",
  "TERAC_PROJECT_ID",
  "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
  "AGENT_WALLET_METADATA",
  "DYNAMIC_API_KEY",
  "RUNWARE_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "XAI_API_KEY",
] as const;

function isEnvSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function InternalEnvPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ENV_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{key}</span>
            <span>{isEnvSet(key) ? "set" : "missing"}</span>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">
          Admin seed ready: {isSupabaseAdminConfigured() ? "yes" : "no"}
        </p>
      </CardContent>
    </Card>
  );
}
