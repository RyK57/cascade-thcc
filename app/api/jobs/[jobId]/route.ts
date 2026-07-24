import { NextResponse } from "next/server";
import { z } from "zod";
import { getJobById } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const jobIdSchema = z.string().uuid();

/** Job + payment snapshot — polled by the Mission Control canvas. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const { jobId } = await params;
  if (!jobIdSchema.safeParse(jobId).success) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  try {
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const payment = await getPaymentByJobId(jobId);
    return NextResponse.json({ job, payment: payment ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
