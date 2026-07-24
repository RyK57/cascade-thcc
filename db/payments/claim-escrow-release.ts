import { createAdminClient } from "@/utils/supabase/admin";
import type { Payment } from "@/utils/schema/payment";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

/**
 * Atomically claim the escrow-release slot. Returns the payment when this
 * caller won the race; null when another caller already released (or missing).
 */
export async function claimEscrowRelease(
  paymentId: string
): Promise<Payment | null> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({
      escrow_released_at: now,
      updated_at: now,
    })
    .eq("id", paymentId)
    .is("escrow_released_at", null)
    .select(PAYMENT_ROW_COLUMNS)
    .maybeSingle<PaymentRow>();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapPaymentRow(data);
}
