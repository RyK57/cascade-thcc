import { DashboardPageHeader } from "@/components/app/dashboard-page-header";
import { listJobsByRequesterHandle } from "@/db/jobs";
import { listPaymentsByJobIds } from "@/db/payments";
import type { AccountIdentity } from "@/libs/account";
import { AccountJobs } from "./account-jobs";
import { getAgentNumber, IMessageHandoff } from "./imessage-handoff";
import { WalletSection } from "./wallet-section";

interface AccountHomeProps {
  identity: AccountIdentity;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

/**
 * The signed-in customer home. Reads jobs by the phone the session proved, so
 * the web app shows exactly the work that person started in iMessage — no
 * operator view, no other people's threads.
 */
export async function AccountHome({ identity }: AccountHomeProps) {
  const jobs = await listJobsByRequesterHandle(identity.session.phone).catch(
    () => []
  );
  const payments = await listPaymentsByJobIds(jobs.map((job) => job.id)).catch(
    () => new Map()
  );

  const number = getAgentNumber();

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Your Cascade account"
        description={`Signed in as ${formatPhone(identity.session.phone)}. Everything you started in Messages, with the money attached. Approvals still happen in the thread — this is where you fund escrow and check what settled.`}
      />

      <section aria-labelledby="jobs-heading" className="space-y-4">
        <h2 id="jobs-heading" className="label-caps text-muted-foreground">
          Jobs
        </h2>
        <AccountJobs jobs={jobs} payments={payments} />
      </section>

      <IMessageHandoff
        number={number}
        linkedPhone={identity.session.phone}
      />
      <WalletSection />
    </div>
  );
}
