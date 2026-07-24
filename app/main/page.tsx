import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { CascadeJobsPanel } from "@/components/app/cascade-jobs-panel";
import { CascadePayPanel } from "@/components/app/cascade-pay-panel";
import { WorkspaceOverview } from "@/components/app/main/workspace-overview";
import { DynamicProvider } from "@/components/dynamic/dynamic-provider";
import { Button } from "@/components/ui/button";
import { getJobById, listOpenJobs } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { ROUTES } from "@/lib/constants/routes";
import { ensureSandboxTreasury } from "@/libs/dynamic/treasury";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Workspace",
};

interface MainPageProps {
  searchParams: Promise<{ job?: string }>;
}

export default async function MainPage({ searchParams }: MainPageProps) {
  const { job: jobId } = await searchParams;

  // No deep link: the holding surface. There is deliberately no job list here
  // until the thread view is wired up.
  if (!jobId || !isSupabaseAdminConfigured()) {
    return <WorkspaceOverview />;
  }

  const [job, payment, treasury, openJobs] = await Promise.all([
    getJobById(jobId),
    getPaymentByJobId(jobId),
    ensureSandboxTreasury(),
    listOpenJobs(10).catch(() => []),
  ]);

  if (!job) {
    return (
      <AppShell className="py-12 sm:py-16">
        <div className="max-w-[54ch]">
          <p className="label-caps text-accent-ink">Job not found</p>
          <h1 className="mt-6 font-secondary text-3xl sm:text-4xl">
            That payment link has expired
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The job this link points to no longer exists — it may have been
            cancelled or already settled. Nothing was charged. Check the latest
            link in your iMessage thread.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href={ROUTES.main}>Back to workspace</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="py-12 sm:py-16">
      <div className="max-w-[58ch]">
        <p className="label-caps text-accent-ink">Payment</p>
        <h1 className="mt-6 font-secondary text-4xl sm:text-5xl">
          Confirm this job
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          You started this in iMessage. Fund the escrow here and the agent picks
          the thread back up — nothing moves until you confirm.
        </p>
      </div>

      <div className="mt-12 max-w-3xl">
        <DynamicProvider>
          <CascadePayPanel
            jobId={job.id}
            title={job.title}
            amountCents={
              payment?.amountCents ??
              job.priceUsdCents ??
              job.quotedTotalCents ??
              0
            }
            treasuryAddress={treasury.address}
            status={payment?.status ?? job.status}
          />
        </DynamicProvider>

        <CascadeJobsPanel jobs={openJobs} />
      </div>
    </AppShell>
  );
}
