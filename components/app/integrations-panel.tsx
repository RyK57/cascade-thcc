import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicAuthPanel } from "@/components/dynamic";
import { BRAND } from "@/lib/constants/branding";
import { isDynamicConfigured } from "@/libs/dynamic";
import { isDynamicSandboxConfigured } from "@/libs/dynamic/sandbox";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";

const INTEGRATIONS = [
  {
    name: "Linq",
    status: isLinqConfigured() ? "configured" : "missing",
    env: "LINQ_API_V3_API_KEY",
    note: "iMessage channel — intake, typing, tapbacks, status lines",
  },
  {
    name: "Terac",
    status: isTeracConfigured() ? "configured" : "missing",
    env: "TERAC_API_KEY",
    note: "Expert tier — draft quote, launch on confirm, poll submissions",
  },
  {
    name: "Dynamic",
    status: isDynamicConfigured() ? "configured" : "missing",
    env: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
    note: isDynamicSandboxConfigured()
      ? "Sandbox wallets + Base Sepolia escrow/payout"
      : "Sandbox wallets (Base Sepolia only — no real funds)",
  },
] as const;

export function IntegrationsPanel() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="space-y-1">
        <h1 className="font-secondary text-3xl">{BRAND.name}</h1>
        <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
        <p className="text-xs text-muted-foreground">
          Tiers: AI (free) · Peer (seeded) · Expert (Terac) · Payments: sandbox
          only
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
          <CardTitle className="text-base">Dynamic sandbox login</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicAuthPanel />
        </CardContent>
      </Card>
    </div>
  );
}
