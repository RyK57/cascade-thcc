import { CascadeJobsPanel } from "@/components/app/cascade-jobs-panel";
import { CascadePayPanel } from "@/components/app/cascade-pay-panel";
import { IntegrationsPanel } from "@/components/app";
import { getJobById, listOpenJobs } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { ensureSandboxTreasury } from "@/libs/dynamic/treasury";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

interface MainPageProps {
  searchParams: Promise<{ job?: string }>;
}

export default async function MainPage({ searchParams }: MainPageProps) {
  const { job: jobId } = await searchParams;

  if (!jobId || !isSupabaseAdminConfigured()) {
    return <IntegrationsPanel />;
  }

  const [job, payment, treasury, openJobs] = await Promise.all([
    getJobById(jobId),
    getPaymentByJobId(jobId),
    ensureSandboxTreasury(),
    listOpenJobs(10).catch(() => []),
  ]);

  if (!job) {
    return <IntegrationsPanel />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="space-y-1">
        <h1 className="font-secondary text-3xl">Cascade</h1>
        <p className="text-sm text-muted-foreground">
          Sandbox escrow on Base Sepolia — no real dollars.
        </p>
      </div>

      <CascadePayPanel
        jobId={job.id}
        title={job.title}
        amountCents={
          payment?.amountCents ?? job.priceUsdCents ?? job.quotedTotalCents ?? 0
        }
        treasuryAddress={treasury.address}
        status={payment?.status ?? job.status}
      />

      <CascadeJobsPanel jobs={openJobs} />
    </div>
  );
}
