import { createAdminClient } from "@/utils/supabase/admin";
import { listSubmissions } from "@/libs/terac";
import { applyTrustRating } from "./trust-audit";
import { parseTrustRating } from "./parse-trust-rating";

interface TrustAuditRow {
  id: string;
  peer_user_id: string;
  terac_opportunity_id: string | null;
  trust_before: number | null;
  status: string;
}

export interface PollTrustAuditsResult {
  checked: number;
  applied: number;
}

/**
 * Pull Terac submissions for open trust audits and apply 1–5 ratings.
 */
export async function pollTrustAudits(): Promise<PollTrustAuditsResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trust_audits")
    .select("id, peer_user_id, terac_opportunity_id, trust_before, status")
    .in("status", ["pending", "launched"])
    .not("terac_opportunity_id", "is", null)
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  const audits = (data ?? []) as TrustAuditRow[];
  let applied = 0;

  for (const audit of audits) {
    if (!audit.terac_opportunity_id) continue;
    try {
      const { data: submissions } = await listSubmissions({
        opportunityId: audit.terac_opportunity_id,
        limit: 5,
      });
      const text =
        submissions
          ?.map((s) => {
            const raw = s as {
              answer?: string;
              response?: string;
              content?: string;
              notes?: string;
            };
            return raw.answer ?? raw.response ?? raw.content ?? raw.notes ?? "";
          })
          .find((t) => t.trim().length > 0) ?? "";
      const rating = parseTrustRating(text);
      if (rating === null) continue;

      await applyTrustRating({
        auditId: audit.id,
        peerUserId: audit.peer_user_id,
        rating,
        trustBefore: audit.trust_before ?? 50,
      });
      applied += 1;
    } catch (err) {
      console.warn("[cascade] trust audit poll failed", audit.id, err);
    }
  }

  return { checked: audits.length, applied };
}
