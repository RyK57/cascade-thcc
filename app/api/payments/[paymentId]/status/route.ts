import { NextResponse } from "next/server";
import { z } from "zod";
import { settlePayment } from "@/libs/agent";
import { paymentStatusSchema } from "@/utils/schema/payment";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const bodySchema = z.object({
  status: paymentStatusSchema,
  dynamicWalletAddress: z.string().optional(),
});

/**
 * Called from the Dynamic payment flow (wallet UI / future webhook) to move
 * payment state forward. On "settled" the job closes and the requester gets a
 * confirmation text on the original thread.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { paymentId } = await params;

  try {
    const payment = await settlePayment({
      paymentId,
      status: parsed.data.status,
      dynamicWalletAddress: parsed.data.dynamicWalletAddress,
    });
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment update failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
