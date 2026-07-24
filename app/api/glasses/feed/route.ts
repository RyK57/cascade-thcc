import { NextResponse } from "next/server";
import { listRecentJobs } from "@/db/jobs";
import { formatCents } from "@/libs/agent/reply-templates";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Job feed for the Ray-Ban Display HUD. Read-only, polled every few seconds
 * from the glasses browser. Optional shared-secret via GLASSES_TOKEN.
 */
export async function GET(request: Request) {
  const token = process.env.GLASSES_TOKEN?.trim();
  if (token) {
    const provided = new URL(request.url).searchParams.get("token");
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ jobs: [] });
  }

  const jobs = await listRecentJobs(6);
  return NextResponse.json({
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      tier: job.tier ?? "…",
      status: job.status,
      price:
        job.priceUsdCents !== undefined
          ? formatCents(job.priceUsdCents, job.quotedCurrency)
          : job.quotedTotalCents !== undefined
            ? formatCents(job.quotedTotalCents, job.quotedCurrency)
            : null,
      updatedAt: job.updatedAt,
    })),
  });
}
