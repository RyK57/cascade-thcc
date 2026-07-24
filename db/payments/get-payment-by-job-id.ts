import { createAdminClient } from "@/utils/supabase/admin";
import type { Payment } from "@/utils/schema/payment";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

export async function getPaymentByJobId(
  jobId: string
): Promise<Payment | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_ROW_COLUMNS)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaymentRow>();

  if (error) throw new Error(error.message);
  return data ? mapPaymentRow(data) : null;
}
