import { Badge } from "@/components/ui/badge";
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
    <ul className="divide-y divide-hairline">
      {integrations.map((item) => (
        <li
          key={item.name}
          className="grid gap-x-6 gap-y-2 py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-start"
        >
          <div>
            <p className="text-xs text-muted-foreground">{item.role}</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {item.name}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.note}
          </p>
          <Badge variant={item.ready ? "secondary" : "outline"}>
            {item.ready ? "Ready" : "Missing"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
