-- Record which chat a peer bid arrived on, so the auction can award the job to
-- the lowest bidder even when they are not the peer who bid most recently.
alter table public.job_bids
  add column if not exists chat_id text;
