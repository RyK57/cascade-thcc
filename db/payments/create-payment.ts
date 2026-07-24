import { createAdminClient } from "@/utils/supabase/admin";
import type { CreatePaymentInput, Payment } from "@/utils/schema/payment";
import { createPaymentSchema, PAYMENT_STATUS } from "@/utils/schema/payment";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

export async function createPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const parsed = createPaymentSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      job_id: parsed.jobId,
      terac_submission_id: parsed.teracSubmissionId,
      amount_cents: parsed.amountCents,
      currency: parsed.currency,
      asset: parsed.asset,
      status: PAYMENT_STATUS.pending,
    })
    .select(PAYMENT_ROW_COLUMNS)
    .single<PaymentRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create payment");
  }

  return mapPaymentRow(data);
}
