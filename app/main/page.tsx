import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/app/dashboard-page-header";
import { AccountHome } from "@/components/app/main/account-home";
import { WorkspaceOverview } from "@/components/app/main/workspace-overview";
import { MissionControl } from "@/components/app/mission-control";
import { DynamicProvider } from "@/components/dynamic/dynamic-provider";
import { Button } from "@/components/ui/button";
import { getJobById } from "@/db/jobs";
import { getAccountIdentity, samePhone } from "@/libs/account";
import { ROUTES } from "@/lib/constants/routes";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Workspace",
};

interface MainPageProps {
  searchParams: Promise<{ job?: string }>;
}

/**
 * `/main` — signed-in workspace (Messages handoff + wallet).
 * `/main?job=<id>` — escrow checkout for a job pay link (Dynamic scoped here).
 */
export default async function MainPage({ searchParams }: MainPageProps) {
  const { job: jobId } = await searchParams;
  const identity = await getAccountIdentity().catch(() => null);

  if (!jobId) {
    // A phone-verified visitor is a customer with a history; anyone else gets
    // the generic "start in Messages" pitch.
    return identity ? (
      <AccountHome identity={identity} />
    ) : (
      <WorkspaceOverview />
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Checkout unavailable"
          description="This payment link can’t load in the current environment. Nothing was charged — open the latest link from Messages, or try again shortly."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.main}>Back to overview</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const job = await getJobById(jobId).catch(() => null);
  if (!job) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Payment link expired"
          description="This job no longer exists — it may have been cancelled or already settled. Nothing was charged. Check the latest link in your iMessage thread."
          actions={
            <Button size="sm" asChild>
              <Link href={ROUTES.main}>Back to overview</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // A verified session on someone else's job still renders checkout — a friend
  // paying for you is a real case — but it must not claim to be their account.
  const isOwnJob = Boolean(
    identity && samePhone(identity.session.phone, job.requesterHandle)
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Checkout"
        description={
          isOwnJob
            ? "You started this in iMessage. Fund the Cascade agent wallet here — worker payout releases only after you approve in the thread."
            : "Fund the Cascade agent wallet for this job. Worker payout releases only after the requester approves in their Messages thread."
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.main}>
              {isOwnJob ? "Your jobs" : "Overview"}
            </Link>
          </Button>
        }
      />
      <DynamicProvider>
        <MissionControl jobId={job.id} />
      </DynamicProvider>
    </div>
  );
}
