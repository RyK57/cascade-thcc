import { createAdminClient } from "@/utils/supabase/admin";
import type { Payment } from "@/utils/schema/payment";
import { z } from "zod";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

const updatePaymentSchema = z
  .object({
    escrowTxHash: z.string().min(1).optional(),
    dynamicWalletAddress: z.string().min(1).optional(),
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
