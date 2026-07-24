import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/app/dashboard-page-header";
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

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Checkout"
        description="Fund the Cascade agent wallet for this job. Worker payout releases only after you approve in the Messages thread."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.main}>Overview</Link>
          </Button>
        }
      />
      <DynamicProvider>
        <MissionControl jobId={job.id} />
      </DynamicProvider>
    </div>
  );
}
