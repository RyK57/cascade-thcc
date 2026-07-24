import { isDynamicConfigured } from "@/libs/dynamic/config";
import { isDynamicSandboxConfigured } from "@/libs/dynamic/sandbox";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";

/**
 * Moved off `/main`, where a service-readiness checklist was standing in for
 * the product. It belongs here: it answers an operator's question, not a
 * customer's.
 */
function getIntegrations() {
  return [
    {
      name: "Linq",
      role: "Channel",
      ready: isLinqConfigured(),
      note: "iMessage intake and replies — typing, tapbacks, status lines.",
    },
    {
      name: "Terac",
      role: "Experts",
      ready: isTeracConfigured(),
      note: "Draft a quote for free, launch only on an explicit confirm, poll submissions.",
    },
    {
      name: "Dynamic",
      role: "Payments",
      ready: isDynamicConfigured(),
      note: isDynamicSandboxConfigured()
        ? "Embedded wallets plus Base Sepolia escrow and payout."
        : "Embedded wallets. Sandbox only — Base Sepolia, no real funds.",
    },
  ];
}

export function InternalIntegrationsPanel() {
  const integrations = getIntegrations();

  return (
    <section aria-labelledby="integrations-heading">
      <p className="label-caps text-muted-foreground">Services</p>
      <h2
        id="integrations-heading"
        className="mt-6 font-secondary text-2xl sm:text-3xl"
      >
        Integrations
      </h2>

      <ul className="mt-8 border-t border-hairline">
        {integrations.map((item) => (
          <li
            key={item.name}
            className="grid gap-x-6 gap-y-2 border-b border-hairline py-5 sm:grid-cols-[9rem_1fr_auto]"
          >
            <div>
              <p className="label-caps text-muted-foreground">{item.role}</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {item.name}
              </p>
            </div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              {item.note}
            </p>
            <p
              className={`text-sm sm:text-right ${
                item.ready ? "text-accent-ink" : "text-muted-foreground"
              }`}
            >
              {item.ready ? "Ready" : "Not configured"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
