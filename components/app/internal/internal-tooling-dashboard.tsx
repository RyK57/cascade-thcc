import { InternalEnvPanel } from "./internal-env-panel";
import { InternalHealthPanel } from "./internal-health-panel";
import { InternalSeedJobButton } from "./internal-seed-job-button";
import { InternalSeedPanel } from "./internal-seed-panel";
import { InternalSupabasePanel } from "./internal-supabase-panel";

export function InternalToolingDashboard() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <InternalSupabasePanel />
      <InternalEnvPanel />
      <InternalHealthPanel />
      <InternalSeedPanel />
      <InternalSeedJobButton />
    </div>
  );
}
