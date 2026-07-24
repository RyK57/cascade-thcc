/**
 * Launch / ingest a Terac GP feedback opportunity for Cascade demos.
 *
 * Usage:
 *   pnpm exec tsx scripts/terac-feedback-job.ts
 *   pnpm exec tsx scripts/terac-feedback-job.ts --phase=ingest --opportunity=<id>
 *
 * Requires TERAC_API_KEY + TERAC_PROJECT_ID (and optionally Supabase for metrics).
 */
import { createAdminClient } from "@/utils/supabase/admin";
import {
  createDraftOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  launchOpportunity,
  listSubmissions,
} from "@/libs/terac";

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

async function baseline() {
  if (!isTeracConfigured()) {
    console.error("Terac is not configured. Set TERAC_API_KEY.");
    process.exit(1);
  }
  const projectId = getTeracProjectId();
  if (!projectId) {
    console.error("Set TERAC_PROJECT_ID.");
    process.exit(1);
  }

  const opportunity = await createDraftOpportunity({
    title: "Use Cascade 10 min; rank AI / peer / expert",
    description: [
      "Spend ~10 minutes using Cascade over iMessage.",
      "Rank the three paths (AI, peer, Terac expert) 1–3 for clarity, speed, and trust.",
      "Reply with: AI=<n> peer=<n> expert=<n> and one sentence of feedback.",
    ].join("\n"),
    projectId,
    numParticipants: 3,
    businessType: "b2c",
    internalTitle: `cascade-feedback-${Date.now()}`,
    expectedDaysToComplete: 2,
  });

  await launchOpportunity(opportunity.id);

  try {
    const supabase = createAdminClient();
    await supabase.from("demo_metrics").upsert(
      {
        key: "feedback_job_baseline",
        label: "Cascade feedback job baseline",
        before_value: opportunity.pricing?.total_cost_cents ?? 0,
        notes: `opportunity=${opportunity.id}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (error) {
    console.warn("Could not write demo_metrics (Supabase optional):", error);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: "baseline",
        opportunityId: opportunity.id,
        pricing: opportunity.pricing,
        next: `pnpm exec tsx scripts/terac-feedback-job.ts --phase=ingest --opportunity=${opportunity.id}`,
      },
      null,
      2
    )
  );
}

function parseRanks(text: string): { ai?: number; peer?: number; expert?: number } {
  const ai = text.match(/\bAI\s*=\s*([1-3])\b/i);
  const peer = text.match(/\bpeer\s*=\s*([1-3])\b/i);
  const expert = text.match(/\bexpert\s*=\s*([1-3])\b/i);
  return {
    ai: ai ? Number(ai[1]) : undefined,
    peer: peer ? Number(peer[1]) : undefined,
    expert: expert ? Number(expert[1]) : undefined,
  };
}

async function ingest(opportunityId: string) {
  if (!isTeracConfigured()) {
    console.error("Terac is not configured. Set TERAC_API_KEY.");
    process.exit(1);
  }

  const { data } = await listSubmissions({ opportunityId, limit: 25 });
  const ranks = (data ?? []).map((s) => {
    const raw = s as { answer?: string; response?: string; content?: string };
    const text = raw.answer ?? raw.response ?? raw.content ?? JSON.stringify(s);
    return parseRanks(text);
  });

  const scored = ranks.filter((r) => r.ai || r.peer || r.expert);
  const avg = (key: "ai" | "peer" | "expert") => {
    const vals = scored.map((r) => r[key]).filter((n): n is number => n !== undefined);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const preference =
    [
      ["ai", avg("ai")],
      ["peer", avg("peer")],
      ["expert", avg("expert")],
    ] as const;
  const best = preference
    .filter(([, v]) => v !== null)
    .sort((a, b) => (a[1] ?? 99) - (b[1] ?? 99))[0];

  const afterValue = best?.[1] ?? scored.length;

  try {
    const supabase = createAdminClient();
    await supabase.from("demo_metrics").upsert(
      {
        key: "feedback_job_baseline",
        label: "Cascade feedback job (lower rank = better)",
        after_value: afterValue,
        notes: JSON.stringify({
          opportunity: opportunityId,
          submissions: scored.length,
          averages: { ai: avg("ai"), peer: avg("peer"), expert: avg("expert") },
          preferred: best?.[0] ?? null,
        }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (error) {
    console.warn("Could not write demo_metrics (Supabase optional):", error);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        phase: "ingest",
        opportunityId,
        submissions: scored.length,
        averages: { ai: avg("ai"), peer: avg("peer"), expert: avg("expert") },
        preferred: best?.[0] ?? null,
        afterValue,
      },
      null,
      2
    )
  );
}

async function main() {
  const phase = argValue("--phase") ?? "baseline";
  if (phase === "ingest") {
    const opportunity = argValue("--opportunity");
    if (!opportunity) {
      console.error("Pass --opportunity=<id> for ingest.");
      process.exit(1);
    }
    await ingest(opportunity);
    return;
  }
  await baseline();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
