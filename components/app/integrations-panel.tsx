import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicAuthButton } from "@/components/dynamic";
import { isDynamicConfigured } from "@/libs/dynamic";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";

const INTEGRATIONS = [
  {
    name: "Linq",
    status: isLinqConfigured() ? "configured" : "missing",
    env: "LINQ_API_V3_API_KEY",
    note: "iMessage / SMS partner API via @linqapp/sdk",
  },
  {
    name: "Terac",
    status: isTeracConfigured() ? "configured" : "missing",
    env: "TERAC_API_KEY",
    note: "Verified human labor REST API",
  },
  {
    name: "Dynamic",
    status: isDynamicConfigured() ? "configured" : "missing",
    env: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
    note: "Wallet + auth via Dynamic React SDK",
  },
] as const;

export function IntegrationsPanel() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="space-y-1">
        <h1 className="font-secondary text-3xl">Hackathon stack</h1>
        <p className="text-sm text-muted-foreground">
          Linq messaging, Terac human labor, and Dynamic wallets are wired in.
        </p>
      </div>

      <div className="grid gap-3">
        {INTEGRATIONS.map((item) => (
          <Card key={item.name}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{item.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {item.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{item.note}</p>
              <p>
                Env: <code>{item.env}</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dynamic login</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicAuthButton />
        </CardContent>
      </Card>
    </div>
  );
}
