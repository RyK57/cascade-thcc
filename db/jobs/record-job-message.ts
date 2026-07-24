import { createAdminClient } from "@/utils/supabase/admin";

export const MESSAGE_DIRECTION = {
  inbound: "inbound",
  outbound: "outbound",
} as const;

export type MessageDirection =
  (typeof MESSAGE_DIRECTION)[keyof typeof MESSAGE_DIRECTION];

interface RecordJobMessageInput {
  jobId: string;
  linqMessageId: string;
  direction: MessageDirection;
  body: string;
}

/**
 * Returns false when the Linq message ID was already recorded, so webhook
 * retries and duplicate deliveries skip the agent turn.
 */
export async function recordJobMessage({
  jobId,
  linqMessageId,
  direction,
  body,
}: RecordJobMessageInput): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("job_messages").insert({
    job_id: jobId,
    linq_message_id: linqMessageId,
    direction,
    body,
  });

  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }

  return true;
}
