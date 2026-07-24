import { createAdminClient } from "@/utils/supabase/admin";
import { PAY_ASSET_VALUES } from "@/libs/dynamic/assets";
import type { Payment } from "@/utils/schema/payment";
import { z } from "zod";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

const updatePaymentSchema = z
  .object({
    escrowTxHash: z.string().min(1).optional(),
    dynamicWalletAddress: z.string().min(1).optional(),
    escrowHeldAt: z.string().optional(),
    escrowReleasedAt: z.string().optional(),
    // Switching asset mid-quote has to reach the row the fund route settles
    // against, or the thread and the ledger disagree about what was owed.
    asset: z.enum(PAY_ASSET_VALUES).optional(),
  })
  .partial();

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentInput
): Promise<Payment> {
  const parsed = updatePaymentSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .update({
      escrow_tx_hash: parsed.escrowTxHash,
      dynamic_wallet_address: parsed.dynamicWalletAddress,
      escrow_held_at: parsed.escrowHeldAt,
      escrow_released_at: parsed.escrowReleasedAt,
      asset: parsed.asset,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .select(PAYMENT_ROW_COLUMNS)
    .single<PaymentRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update payment");
  }

  return mapPaymentRow(data);
}
