import { AppShell } from "@/components/app/app-shell";
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
    <AppShell className="py-12 sm:py-16">
      <div className="max-w-[58ch]">
        <h1 className="font-secondary text-4xl sm:text-5xl">Tooling</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Operator view of this deployment. Secret values are never rendered —
          only whether each integration is wired.
        </p>
      </div>

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        <InternalIntegrationsPanel />
        <InternalEnvPanel />
        <InternalRunbookPanel />
        <section aria-labelledby="seed-heading">
          <p className="label-caps text-muted-foreground">Demo</p>
          <h2
            id="seed-heading"
            className="mt-6 font-secondary text-2xl sm:text-3xl"
          >
            Seed a checkout job
          </h2>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
            Creates a payment-ready job so you can exercise the customer pay
            link without going through iMessage.
          </p>
          <div className="mt-6 max-w-xl">
            <InternalSeedJobButton />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
