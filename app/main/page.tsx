import { IntegrationsPanel } from "@/components/app";
import { MissionControl } from "@/components/app/mission-control";

interface MainPageProps {
  searchParams: Promise<{ job?: string }>;
}

export default async function MainPage({ searchParams }: MainPageProps) {
  const { job } = await searchParams;
  if (job) return <MissionControl jobId={job} />;
  return <IntegrationsPanel />;
}
