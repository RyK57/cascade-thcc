import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/**
 * Ten flat rows told you nothing about which subsystem was broken. Grouped by
 * what stops working when a key is missing.
 *
 * STRIPE_SECRET_KEY is deliberately absent: Dynamic is the payment rail, and a
 * Stripe key tracked here implied there was a second one.
 */
const ENV_GROUPS = [
  {
    name: "Supabase",
    keys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    name: "Integrations",
    keys: [
      "LINQ_API_V3_API_KEY",
      "TERAC_API_KEY",
      "TERAC_PROJECT_ID",
      "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
      "DYNAMIC_API_KEY",
      "AGENT_WALLET_METADATA",
      "RUNWARE_API_KEY",
      "GLASSES_TOKEN",
    ],
  },
  {
    name: "Model providers",
    keys: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "XAI_API_KEY"],
  },
] as const;

function isEnvSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function InternalEnvPanel() {
  const adminReady = isSupabaseAdminConfigured();

  return (
    <section aria-labelledby="env-heading">
      <p className="label-caps text-muted-foreground">Configuration</p>
      <h2 id="env-heading" className="mt-6 font-secondary text-2xl sm:text-3xl">
        Environment
      </h2>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
        Presence only — no value is ever read into this page. A missing key
        disables its group; it doesn’t break the rest of the app.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-hairline">
        {/*
          A table, not two spans side by side: `scope="row"` binds the variable
          name to its status cell and `scope="rowgroup"` binds both to the
          group, so a screen reader reads "Supabase, TERAC_API_KEY, Status, Set"
          rather than an unattached "set".
        */}
        <table className="w-full min-w-[20rem] border-collapse text-left">
          <caption className="sr-only">
            Environment variables by subsystem, and whether each one is set
          </caption>
          <thead>
            <tr className="border-b border-hairline">
              <th
                scope="col"
                className="label-caps px-3 py-3.5 font-normal text-muted-foreground sm:px-5"
              >
                Variable
              </th>
              <th
                scope="col"
                className="label-caps px-3 py-3.5 text-right font-normal text-muted-foreground sm:px-5"
              >
                Status
              </th>
            </tr>
          </thead>
          {ENV_GROUPS.map((group) => (
            <tbody key={group.name}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={2}
                  className="label-caps border-b border-hairline bg-foreground/[0.03] px-3 py-3 text-left font-normal text-accent-ink sm:px-5"
                >
                  {group.name}
                </th>
              </tr>
              {group.keys.map((key) => {
                const set = isEnvSet(key);
                return (
                  <tr
                    key={key}
                    className="border-b border-hairline last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="px-3 py-3 font-mono text-xs font-normal break-all text-foreground sm:px-5"
                    >
                      {key}
                    </th>
                    <td className="px-3 py-3 text-right text-sm whitespace-nowrap sm:px-5">
                      <span
                        className={
                          set ? "text-accent-ink" : "text-muted-foreground"
                        }
                      >
                        {set ? "Set" : "Not set"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Supabase admin access, needed for seeding:{" "}
        <span className={adminReady ? "text-accent-ink" : "text-foreground"}>
          {adminReady ? "available" : "not available"}
        </span>
      </p>
    </section>
  );
}
