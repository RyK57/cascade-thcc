import { AppShell } from "@/components/app/app-shell";
import { getAgentNumber, IMessageHandoff } from "./imessage-handoff";
import { WalletSection } from "./wallet-section";

export function WorkspaceOverview() {
  const number = getAgentNumber();

  return (
    <AppShell className="py-12 sm:py-16">
      <div className="max-w-[58ch]">
        <p className="label-caps text-accent-ink">Workspace</p>
        <h1 className="mt-6 font-secondary text-4xl sm:text-5xl">
          Pick up where you left off
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Jobs start in Messages. When a quote needs payment, the thread sends
          you here to fund escrow — then you approve the work back in the same
          conversation.
        </p>
      </div>

      <div className="mt-12">
        <IMessageHandoff number={number} />
      </div>

      <WalletSection />
    </AppShell>
  );
}
