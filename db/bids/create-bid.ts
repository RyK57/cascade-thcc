import { createAdminClient } from "@/utils/supabase/admin";

export interface JobBid {
  id: string;
  jobId: string;
  peerUserId: string;
  bidCredits: number;
  createdAt: string;
}

export async function upsertJobBid(params: {
  jobId: string;
  peerUserId: string;
  bidCredits: number;
}): Promise<JobBid> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_bids")
    .upsert(
      {
        job_id: params.jobId,
        peer_user_id: params.peerUserId,
        bid_credits: params.bidCredits,
      },
      { onConflict: "job_id,peer_user_id" }
    )
    .select("id, job_id, peer_user_id, bid_credits, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert bid");
  }

  return {
    id: data.id,
    jobId: data.job_id,
    peerUserId: data.peer_user_id,
    bidCredits: data.bid_credits,
    createdAt: data.created_at,
  };
}

export async function listJobBids(jobId: string): Promise<JobBid[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_bids")
    .select("id, job_id, peer_user_id, bid_credits, created_at")
    .eq("job_id", jobId)
    .order("bid_credits", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    jobId: row.job_id,
    peerUserId: row.peer_user_id,
    bidCredits: row.bid_credits,
    createdAt: row.created_at,
  }));
}

/** Second-price: winner is lowest bid; pays min(secondLowest, floor). */
export function secondPriceClear(bids: JobBid[], floorCredits: number): {
  winnerUserId: string;
  priceCredits: number;
} | null {
  if (!bids.length) return null;
  const sorted = [...bids].sort((a, b) => a.bidCredits - b.bidCredits);
  const winner = sorted[0];
  const second = sorted[1]?.bidCredits ?? winner.bidCredits;
  return {
    winnerUserId: winner.peerUserId,
    priceCredits: Math.max(floorCredits, Math.min(second, winner.bidCredits + 1)),
  };
}
