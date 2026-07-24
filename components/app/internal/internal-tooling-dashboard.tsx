import { AppShell } from "@/components/app/app-shell";
import { InternalEnvPanel } from "./internal-env-panel";
import { InternalIntegrationsPanel } from "./internal-integrations-panel";
import { InternalRunbookPanel } from "./internal-runbook-panel";

/**
 * Four identical cards in a 2×2 grid gave every panel the same weight and no
 * reading order. This runs top to bottom in the order an operator asks the
 * questions: is the product wired up, is the environment complete, what can I
 * run about it.
 */
export function InternalToolingDashboard() {
  return (
    <AppShell className="py-12 sm:py-16">
      <div className="max-w-[58ch]">
        <h1 className="font-secondary text-4xl sm:text-5xl">Tooling</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Operator view of this deployment. Read-only — nothing here changes
          state, and no secret value is ever rendered.
        </p>
      </div>

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        <InternalIntegrationsPanel />
        <InternalEnvPanel />
        <InternalRunbookPanel />
      </div>
    </AppShell>
  );
}
