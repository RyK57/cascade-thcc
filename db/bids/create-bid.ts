import { createAdminClient } from "@/utils/supabase/admin";

export interface JobBid {
  id: string;
  jobId: string;
  peerUserId: string;
  bidCredits: number;
  /** Chat the bid arrived on — becomes the winner's claim chat. */
  chatId?: string;
  createdAt: string;
}

const BID_COLUMNS =
  "id, job_id, peer_user_id, bid_credits, chat_id, created_at";

interface JobBidRow {
  id: string;
  job_id: string;
  peer_user_id: string;
  bid_credits: number;
  chat_id: string | null;
  created_at: string;
}

function mapBidRow(row: JobBidRow): JobBid {
  return {
    id: row.id,
    jobId: row.job_id,
    peerUserId: row.peer_user_id,
    bidCredits: row.bid_credits,
    chatId: row.chat_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function upsertJobBid(params: {
  jobId: string;
  peerUserId: string;
  bidCredits: number;
  chatId?: string;
}): Promise<JobBid> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_bids")
    .upsert(
      {
        job_id: params.jobId,
        peer_user_id: params.peerUserId,
        bid_credits: params.bidCredits,
        chat_id: params.chatId,
      },
      { onConflict: "job_id,peer_user_id" }
    )
    .select(BID_COLUMNS)
    .single<JobBidRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert bid");
  }

  return mapBidRow(data);
}

export async function listJobBids(jobId: string): Promise<JobBid[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_bids")
    .select(BID_COLUMNS)
    .eq("job_id", jobId)
    .order("bid_credits", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as JobBidRow[]).map(mapBidRow);
}

/**
 * Reverse Vickrey clear: the lowest bidder wins and is paid the second-lowest
 * bid, floored at `floorCredits`. Paying the second price is what makes bidding
 * your true cost optimal — clamping the payment to the winner's own bid would
 * make this a first-price auction and remove that property.
 *
 * With a single bid there is no second price, so the winner's own bid stands in.
 */
export function secondPriceClear(bids: JobBid[], floorCredits: number): {
  winnerUserId: string;
  winnerBid: JobBid;
  priceCredits: number;
} | null {
  if (!bids.length) return null;
  const sorted = [...bids].sort((a, b) => a.bidCredits - b.bidCredits);
  const winner = sorted[0];
  const second = sorted[1]?.bidCredits ?? winner.bidCredits;
  return {
    winnerUserId: winner.peerUserId,
    winnerBid: winner,
    priceCredits: Math.max(floorCredits, second),
  };
}
