import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/libs/agent/reply-templates";
import { explorerTxUrl } from "@/libs/dynamic/sandbox";
import { ROUTES } from "@/lib/constants/routes";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { jobStatusCopy, needsRequesterAction } from "./job-status-label";

interface AccountJobsProps {
  jobs: Job[];
  payments: Map<string, Payment>;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Every job this phone started, with the money attached to it. This is the
 * thing the product was missing: one place where a requester can see that the
 * text they sent, the escrow they funded, and the payout that settled are all
 * the same piece of work.
 */
export function AccountJobs({ jobs, payments }: AccountJobsProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-hairline p-6 sm:p-8">
        <h2 className="font-secondary text-xl">No jobs yet</h2>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          Text Cascade what you need done. Anything it can answer itself is
          free; anything that needs a person shows up here with a quote.
        </p>
      </div>
    );
  }

  // Anything waiting on the requester goes first — the list is a to-do before
  // it is a history.
  const ordered = [...jobs].sort((a, b) => {
    const aWaiting = needsRequesterAction(a.status) ? 0 : 1;
    const bWaiting = needsRequesterAction(b.status) ? 0 : 1;
    if (aWaiting !== bWaiting) return aWaiting - bWaiting;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline">
      {ordered.map((job) => {
        const status = jobStatusCopy(job.status);
        const payment = payments.get(job.id);
        const waiting = needsRequesterAction(job.status);
        const amountCents = job.priceUsdCents ?? job.quotedTotalCents ?? 0;
        const canPay =
          waiting &&
          payment &&
          payment.status !== PAYMENT_STATUS.settled &&
          job.status !== JOB_STATUS.inReview &&
          job.status !== JOB_STATUS.delivered;

        return (
          <li key={job.id} className="flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{job.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {status.detail}
                </p>
              </div>
              <Badge variant={waiting ? "default" : "outline"}>
                {status.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{formatWhen(job.createdAt)}</span>
              {job.tier ? <span className="capitalize">{job.tier}</span> : null}
              {amountCents > 0 ? <span>{formatCents(amountCents)}</span> : null}
              {payment?.escrowTxHash ? (
                <a
                  href={explorerTxUrl(payment.escrowTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
                >
                  Escrow tx
                  <ArrowUpRight aria-hidden className="size-3.5" />
                </a>
              ) : null}
            </div>

            {canPay ? (
              <div>
                <Button size="sm" asChild>
                  <Link href={`${ROUTES.main}?job=${job.id}`}>
                    Fund escrow
                  </Link>
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
