import { NextResponse } from "next/server";
import { getJobById } from "@/db/jobs";
import { runAgentTurn } from "@/libs/agent";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

/**
 * Approve from the Ray-Ban Display HUD (Neural Band tap). Reuses the exact
 * tapback-affirm path: same state machine as a heart reaction in iMessage —
 * launches quotes, approves deliverables, triggers payouts.
 */
export async function POST(request: Request, context: RouteContext) {
  const token = process.env.GLASSES_TOKEN?.trim();
  if (token) {
    const provided = new URL(request.url).searchParams.get("token");
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { jobId } = await context.params;
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const result = await runAgentTurn({
    kind: "reaction",
    eventId: `glasses:${jobId}:${crypto.randomUUID()}`,
    messageId: job.statusCardMessageId ?? `glasses-${jobId}`,
    chatId: job.linqChatId,
    senderHandle: job.requesterHandle,
    reactionType: "love",
    reactionId: `glasses:${jobId}:${crypto.randomUUID()}`,
    isAffirm: true,
  });

  return NextResponse.json({ ok: true, action: result.action });
}
