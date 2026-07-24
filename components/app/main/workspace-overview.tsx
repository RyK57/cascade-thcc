import { DashboardPageHeader } from "@/components/app/dashboard-page-header";
import { getAgentNumber, IMessageHandoff } from "./imessage-handoff";
import { WalletSection } from "./wallet-section";

export function WorkspaceOverview() {
  const number = getAgentNumber();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Overview"
        description="Jobs run in Messages. Use this workspace to open the agent thread and fund escrow when a quote is ready."
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <IMessageHandoff number={number} />
        <WalletSection />
      </div>
    </div>
  );
}
