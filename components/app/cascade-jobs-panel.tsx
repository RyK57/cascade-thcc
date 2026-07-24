import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/utils/schema/job";

interface CascadeJobsPanelProps {
  jobs: Job[];
}

export function CascadeJobsPanel({ jobs }: CascadeJobsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Open Cascade jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {jobs.length === 0 ? (
          <p className="text-muted-foreground">No active jobs.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-0.5 border-b border-border/60 pb-2 last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{job.title}</span>
                <span className="text-xs text-muted-foreground">
                  {job.tier ?? "—"} · {job.status}
                </span>
              </div>
              <a
                className="text-xs text-brand-accent underline"
                href={`/main?job=${job.id}`}
              >
                Pay / view
              </a>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
