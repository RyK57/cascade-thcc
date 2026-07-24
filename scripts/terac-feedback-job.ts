/**
 * Launch a short Terac feedback opportunity for Cascade demos:
 * "Use Cascade 10 min; rank AI / peer / expert".
 *
 * Usage: pnpm exec tsx scripts/terac-feedback-job.ts
 * Requires TERAC_API_KEY + TERAC_PROJECT_ID (and optionally Supabase for metrics).
 */
import { createAdminClient } from "@/utils/supabase/admin";
import {
  createDraftOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  launchOpportunity,
} from "@/libs/terac";

async function main() {
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
        opportunityId: opportunity.id,
        pricing: opportunity.pricing,
        next: "After results, tweak triage/copy once and set demo_metrics.after_value for the slide.",
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
