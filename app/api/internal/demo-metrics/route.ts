import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/**
 * Dump demo_metrics rows for Terac before/after slides.
 * Local/demo only — gated by CRON_SECRET when set (same as other operator routes).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured." },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("demo_metrics")
    .select("key, label, before_value, after_value, notes, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, metrics: data ?? [] });
}
