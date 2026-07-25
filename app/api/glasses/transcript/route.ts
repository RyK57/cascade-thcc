import { NextResponse } from "next/server";
import { z } from "zod";
import { getLatestJobByHandle } from "@/db/jobs";
import { createAdminClient } from "@/utils/supabase/admin";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const LIVE_PREFIX = "live-transcript:";

/**
 * Live captions: the iOS companion app POSTs partial speech transcripts as
 * the wearer talks; the glasses HUD polls GET to render them in ~1s.
 * Stored as an upserted job_messages row (unique linq_message_id per handle)
 * so it survives Vercel's stateless functions without a schema change.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const parsed = z
    .object({ handle: z.string().min(3), text: z.string().max(2000) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { handle, text } = parsed.data;

  const job = await getLatestJobByHandle(handle);
  if (!job) {
    return NextResponse.json({ error: "No thread for handle" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("job_messages").upsert(
    {
      job_id: job.id,
      linq_message_id: `${LIVE_PREFIX}${handle}`,
      direction: "inbound",
      body: text,
      created_at: new Date().toISOString(),
    },
    { onConflict: "linq_message_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ text: null, reply: null });
  }
  const supabase = createAdminClient();
  const [caption, reply] = await Promise.all([
    supabase
      .from("job_messages")
      .select("body, created_at")
      .like("linq_message_id", `${LIVE_PREFIX}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_messages")
      .select("body, created_at")
      .like("linq_message_id", "live-reply:%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const fresh = (row: { body: string; created_at: string } | null, ttl: number) =>
    row && (Date.now() - new Date(row.created_at).getTime()) / 1000 < ttl
      ? row.body
      : null;

  return NextResponse.json({
    text: fresh(caption.data, 8),
    // Replies linger longer — they're the answer, not a live caption.
    reply: fresh(reply.data, 25),
  });
}
