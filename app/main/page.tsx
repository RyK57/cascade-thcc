import { IntegrationsPanel } from "@/components/app";
import { MissionControl } from "@/components/app/mission-control";

interface MainPageProps {
  searchParams: Promise<{ job?: string }>;
}

/**
 * Pay link (`/main?job=<id>`) opens Mission Control escrow checkout.
 * Without a job id, show the integrations panel.
 */
export default async function MainPage({ searchParams }: MainPageProps) {
  const { job } = await searchParams;
  if (job) return <MissionControl jobId={job} />;
  return <IntegrationsPanel />;
}
