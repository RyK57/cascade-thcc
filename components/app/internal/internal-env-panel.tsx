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
      "AGENT_WALLET_KEY_SHARES",
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
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Presence only — no value is ever read into this page. A missing key
        disables its group; it doesn’t break the rest of the app.
      </p>

      <div className="overflow-x-auto rounded-lg border border-hairline">
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
                className="px-3 py-2.5 text-xs font-medium text-muted-foreground sm:px-4"
              >
                Variable
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground sm:px-4"
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
                  className="border-b border-hairline bg-foreground/[0.03] px-3 py-2 text-left text-xs font-medium text-accent-ink sm:px-4"
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
                      className="px-3 py-2.5 font-mono text-xs font-normal break-all text-foreground sm:px-4"
                    >
                      {key}
                    </th>
                    <td className="px-3 py-2.5 text-right text-sm whitespace-nowrap sm:px-4">
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

      <p className="text-sm text-muted-foreground">
        Supabase admin access, needed for seeding:{" "}
        <span className={adminReady ? "text-accent-ink" : "text-foreground"}>
          {adminReady ? "available" : "not available"}
        </span>
      </p>
    </div>
  );
}
