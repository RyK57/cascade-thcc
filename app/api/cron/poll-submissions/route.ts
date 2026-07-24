import { NextResponse } from "next/server";
import { listJobsByStatus, MESSAGE_DIRECTION, recordJobMessage } from "@/db/jobs";
import { pollExpertSubmissions } from "@/libs/agent";
import { pollTrustAudits } from "@/libs/agent/poll-trust-audits";
import { isLinqConfigured, sendChatMessage } from "@/libs/linq";
import { JOB_STATUS } from "@/utils/schema/job";

export const runtime = "nodejs";

/**
 * Poll Terac submissions for expert jobs + close trust audits.
 * Vercel Hobby allows at most one cron run per day (`0 0 * * *` in vercel.json).
 * Hit this route manually (Authorization: Bearer CRON_SECRET) for faster demo polling.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const jobs = await listJobsByStatus([
    JOB_STATUS.launched,
    JOB_STATUS.inReview,
  ]);

  let notified = 0;
  for (const job of jobs) {
    if (job.tier && job.tier !== "expert") continue;
    const result = await pollExpertSubmissions(job);
    if (!result.notified || !result.reply) continue;

    if (isLinqConfigured()) {
      const sent = await sendChatMessage({
        chatId: job.linqChatId,
        text: result.reply,
        idempotencyKey: `poll-${job.id}-${job.teracSubmissionId ?? "x"}`,
      });
      await recordJobMessage({
        jobId: job.id,
        linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
        direction: MESSAGE_DIRECTION.outbound,
        body: result.reply,
      });
    }
    notified += 1;
  }

  let trustAudits = { checked: 0, applied: 0 };
  try {
    trustAudits = await pollTrustAudits();
  } catch (error) {
    console.warn("[cascade] trust audit poll skipped", error);
  }

  return NextResponse.json({
    ok: true,
    checked: jobs.length,
    notified,
    trustAudits,
  });
}
