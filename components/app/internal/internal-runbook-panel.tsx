import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { ROUTES } from "@/lib/constants/routes";
import { DEMO_ACCOUNT_DEFAULTS } from "@/libs/seed/demo-credentials";

const SEED_COMMAND = "pnpm db:seed";

/**
 * The two things an operator actually runs, kept deliberately quieter than the
 * configuration readout above so the page has a top and a bottom.
 */
export function InternalRunbookPanel() {
  return (
    <section aria-labelledby="runbook-heading">
      <p className="label-caps text-muted-foreground">Runbook</p>
      <h2
        id="runbook-heading"
        className="mt-6 font-secondary text-2xl sm:text-3xl"
      >
        Things you can run
      </h2>

      <div className="mt-8 border-t border-hairline">
        <div className="grid gap-x-6 gap-y-3 border-b border-hairline py-5 sm:grid-cols-[13rem_1fr]">
          <h3 className="text-sm font-medium text-foreground">Health check</h3>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p>
              Confirms the app is up and can reach its dependencies. Returns
              JSON.
            </p>
            <a
              href={ROUTES.api.health}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-sm font-mono text-xs text-accent-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {ROUTES.api.health}
              <ExternalLink aria-hidden className="size-3" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-3 border-b border-hairline py-5 sm:grid-cols-[13rem_1fr]">
          <h3 className="text-sm font-medium text-foreground">
            Seed the demo account
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Needs the Supabase admin key above. Creates or resets the demo
              login and the seeded peer accounts.
            </p>
            <p className="flex flex-wrap items-center gap-1">
              <code className="rounded-sm bg-foreground/5 px-2 py-1 font-mono text-xs text-foreground">
                {SEED_COMMAND}
              </code>
              <CopyButton value={SEED_COMMAND} label="Copy the seed command" />
            </p>
            <p>
              Signs in as{" "}
              <span className="text-foreground">
                {DEMO_ACCOUNT_DEFAULTS.email}
              </span>
              . Override with{" "}
              <code className="font-mono text-xs">DEMO_ACCOUNT_EMAIL</code>,{" "}
              <code className="font-mono text-xs">DEMO_ACCOUNT_PASSWORD</code>,{" "}
              <code className="font-mono text-xs">DEMO_ACCOUNT_NAME</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
