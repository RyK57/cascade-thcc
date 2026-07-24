import { createAdminClient } from "@/utils/supabase/admin";
import {
  createDraftOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  launchOpportunity,
} from "@/libs/terac";

export function shouldAuditDeliverable(deliverableCountHint = 1): boolean {
  const every = Number(process.env.CASCADE_TRUST_AUDIT_EVERY ?? "1");
  if (!Number.isFinite(every) || every <= 0) return false;
  return deliverableCountHint % every === 0;
}

/**
 * Launching a Terac opportunity spends budget, so it stays opt-in. Drafts are
 * free and are always created; without this flag the audit stops at the draft.
 */
export function isTrustAuditAutoLaunchEnabled(): boolean {
  const raw = process.env.CASCADE_TRUST_AUDIT_AUTOLAUNCH?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

/**
 * How many deliverables this peer has submitted, including the one in flight.
 * `shouldAuditDeliverable` samples every Nth, so it needs a real running count.
 */
export async function countPeerDeliverables(
  peerUserId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("assignee_user_id", peerUserId)
    .in("status", ["delivered", "approved", "paid"]);

  if (error) throw new Error(error.message);
  return count ?? 1;
}

export function looksLikeBluff(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 12) return true;
  return /^(done|lmk|ok|k|yes|finished|sent)\.?$/.test(t);
}

/**
 * Launch a short Terac review task to rate a peer deliverable 1–5.
 * Returns opportunity id when Terac is configured; otherwise records a pending audit.
 */
export async function startTrustAudit(params: {
  jobId: string;
  peerUserId: string;
  brief: string;
  deliverable: string;
  trustBefore: number;
}): Promise<{ auditId: string; opportunityId?: string }> {
  const supabase = createAdminClient();
  const { data: audit, error } = await supabase
    .from("trust_audits")
    .insert({
      job_id: params.jobId,
      peer_user_id: params.peerUserId,
      trust_before: params.trustBefore,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !audit) {
    throw new Error(error?.message ?? "Failed to create trust audit");
  }

  const projectId = getTeracProjectId();
  if (!isTeracConfigured() || !projectId) {
    return { auditId: audit.id };
  }

  try {
    const opportunity = await createDraftOpportunity({
      title: "Rate peer deliverable 1-5 vs brief",
      description: `Brief:\n${params.brief}\n\nDeliverable:\n${params.deliverable}\n\nReply with an integer 1-5.`,
      projectId,
      numParticipants: 1,
      businessType: "b2c",
      internalTitle: `trust-audit-${params.jobId}`,
      tasks: [
        {
          sequence: 1,
          task_type: "interview",
          review_type: "manual_review",
          task_url:
            process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
          duration_minutes: 5,
        },
      ],
    });
    // Drafts are free; launching is not. Hard product rule is launch-on-
    // explicit-confirm only, so default to leaving the draft parked.
    const autoLaunch = isTrustAuditAutoLaunchEnabled();
    if (autoLaunch) {
      await launchOpportunity(opportunity.id);
    }
    await supabase
      .from("trust_audits")
      .update({
        terac_opportunity_id: opportunity.id,
        status: autoLaunch ? "launched" : "drafted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", audit.id);
    return { auditId: audit.id, opportunityId: opportunity.id };
  } catch (err) {
    console.warn("[cascade] trust audit Terac launch failed", err);
    return { auditId: audit.id };
  }
}

/** Apply a 1–5 rating into trust_score (± delta) and close the audit. */
export async function applyTrustRating(params: {
  auditId: string;
  peerUserId: string;
  rating: number;
  trustBefore: number;
}): Promise<number> {
  const clamped = Math.max(1, Math.min(5, Math.round(params.rating)));
  const delta = (clamped - 3) * 4;
  const trustAfter = Math.max(0, Math.min(100, params.trustBefore + delta));

  const supabase = createAdminClient();
  await supabase
    .from("users")
    .update({ trust_score: trustAfter })
    .eq("id", params.peerUserId);
  await supabase
    .from("trust_audits")
    .update({
      rating: clamped,
      trust_after: trustAfter,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.auditId);

  await supabase.from("demo_metrics").upsert(
    {
      key: "peer_trust_after_audit",
      label: "Avg peer trust after Terac audit",
      after_value: trustAfter,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  return trustAfter;
}
