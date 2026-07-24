import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import type { Job } from "@/utils/schema/job";

interface CascadeJobsPanelProps {
  jobs: Job[];
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

export function CascadeJobsPanel({ jobs }: CascadeJobsPanelProps) {
  return (
    <section aria-labelledby="open-jobs-heading" className="mt-16">
      <p className="label-caps text-muted-foreground">Also open</p>
      <h2
        id="open-jobs-heading"
        className="mt-6 font-secondary text-2xl sm:text-3xl"
      >
        Other jobs in flight
      </h2>

      {jobs.length === 0 ? (
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          Nothing else is open right now. Jobs appear here as soon as they’re
          quoted in an iMessage thread.
        </p>
      ) : (
        <ul className="mt-8 border-t border-hairline">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-hairline py-4"
            >
              <div className="min-w-0">
                <Link
                  href={`${ROUTES.main}?job=${job.id}`}
                  className="rounded-sm text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {job.title}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                {job.tier ? `${job.tier} · ` : ""}
                {humanize(job.status)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
