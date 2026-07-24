import { NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/components/app/internal/authorize-internal-request";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/** Operator-only dump of demo_metrics rows. */
export async function GET(request: Request) {
  if (!(await authorizeInternalRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Database admin is not configured." },
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
