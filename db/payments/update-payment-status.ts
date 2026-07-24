import { createAdminClient } from "@/utils/supabase/admin";
import type { Payment, PaymentStatus } from "@/utils/schema/payment";
import { paymentStatusSchema } from "@/utils/schema/payment";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  dynamicWalletAddress?: string
): Promise<Payment> {
  const parsedStatus = paymentStatusSchema.parse(status);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .update({
      status: parsedStatus,
      dynamic_wallet_address: dynamicWalletAddress,
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
