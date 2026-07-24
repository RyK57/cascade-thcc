import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";
import { explorerTxUrl } from "@/libs/dynamic/sandbox";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

interface JobPageProps {
  params: Promise<{ jobId: string }>;
}

function formatCents(cents?: number): string {
  if (cents === undefined) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Public read-only job status page — deep link target for Linq status cards.
 */
export default async function JobStatusPage({ params }: JobPageProps) {
  const { jobId } = await params;
  if (!isSupabaseAdminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-secondary text-3xl">{BRAND.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Job status unavailable — Supabase is not configured.
        </p>
      </main>
    );
  }

  const job = await getJobById(jobId).catch(() => null);
  if (!job) notFound();

  const payment = await getPaymentByJobId(job.id).catch(() => null);
  const price = job.priceUsdCents ?? job.quotedTotalCents;
  const escrowExplorer = payment?.escrowTxHash
    ? explorerTxUrl(payment.escrowTxHash)
    : null;

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {BRAND.name} job
        </p>
        <h1 className="mt-2 font-secondary text-4xl">{job.title}</h1>
        {job.description ? (
          <p className="mt-3 text-sm text-muted-foreground">{job.description}</p>
        ) : null}
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{job.status}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Tier</dt>
          <dd className="font-medium">{job.tier ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-medium">{formatCents(price)} USDC</dd>
        </div>
        {job.evSummary ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground">Routing EV</dt>
            <dd className="font-medium">{job.evSummary}</dd>
          </div>
        ) : null}
        {payment ? (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="font-medium">{payment.status}</dd>
            </div>
            {payment.escrowHeldAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Escrow held</dt>
                <dd className="font-medium">
                  {new Date(payment.escrowHeldAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
            {payment.escrowReleasedAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Escrow released</dt>
                <dd className="font-medium">
                  {new Date(payment.escrowReleasedAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-3 text-sm">
        {job.status === "payment_pending" || job.status === "quoted" ? (
          <Link
            href={`${ROUTES.main}?job=${job.id}`}
            className="underline underline-offset-4"
          >
            Fund agent escrow
          </Link>
        ) : null}
        {escrowExplorer ? (
          <a
            href={escrowExplorer}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            View escrow on Basescan
          </a>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Tapbacks in iMessage drive this job: ❤️ affirm · 👎 decline.
      </p>
    </main>
  );
}
