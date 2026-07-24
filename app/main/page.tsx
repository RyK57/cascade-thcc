import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { WorkspaceOverview } from "@/components/app/main/workspace-overview";
import { MissionControl } from "@/components/app/mission-control";
import { DynamicProvider } from "@/components/dynamic/dynamic-provider";
import { Button } from "@/components/ui/button";
import { getJobById } from "@/db/jobs";
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

  if (!jobId) {
    return <WorkspaceOverview />;
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <AppShell className="py-12 sm:py-16">
        <div className="max-w-[54ch]">
          <p className="label-caps text-accent-ink">Payment</p>
          <h1 className="mt-6 font-secondary text-3xl sm:text-4xl">
            Checkout isn’t available right now
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We can’t load this payment link in this environment. Nothing was
            charged — open the latest link from your Messages thread, or try
            again shortly.
          </p>
        </div>
      </AppShell>
    );
  }

  const job = await getJobById(jobId).catch(() => null);
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
    <AppShell className="py-8 sm:py-12">
      <div className="mb-8 max-w-[58ch]">
        <p className="label-caps text-accent-ink">Payment</p>
        <h1 className="mt-4 font-secondary text-3xl sm:text-4xl">
          Confirm this job
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          You started this in iMessage. Fund the Cascade agent wallet here —
          worker payout releases only after you approve in the thread.
        </p>
      </div>
      <DynamicProvider>
        <MissionControl jobId={job.id} />
      </DynamicProvider>
    </AppShell>
  );
}
