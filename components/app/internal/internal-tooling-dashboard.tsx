import { DashboardPageHeader } from "@/components/app/dashboard-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InternalEnvPanel } from "./internal-env-panel";
import { InternalIntegrationsPanel } from "./internal-integrations-panel";
import { InternalRunbookPanel } from "./internal-runbook-panel";
import { InternalSeedJobButton } from "./internal-seed-job-button";

/**
 * Operator-only dashboard. Customers never see this route — layout 404s
 * anyone outside the allowlist. Order: wiring → env → runbook → seed.
 */
export function InternalToolingDashboard() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Internal"
        description="Operator view of this deployment. Secret values are never rendered — only whether each integration is wired."
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle as="h2">Integrations</CardTitle>
            <CardDescription>
              Service readiness for the hiring loop.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InternalIntegrationsPanel />
          </CardContent>
        </Card>

        <Card size="sm" className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle as="h2">Environment</CardTitle>
            <CardDescription>
              Which keys are present — never the values.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InternalEnvPanel />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle as="h2">Runbook</CardTitle>
            <CardDescription>Commands and checks operators run.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InternalRunbookPanel />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle as="h2">Demo checkout</CardTitle>
            <CardDescription>
              Seed a payment-ready job without going through iMessage.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <InternalSeedJobButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
