-- Which asset a payment is settled in. Stablecoin by default so a $12 job
-- stays $12; ETH is opt-in per requester.
alter table public.payments
  add column if not exists asset text not null default 'usdc';

-- Terac work is scheduled human work, not an instant answer. The requester
-- acknowledges the timeline first, then approves the spend — two separate
-- yeses, so "yes" to a turnaround estimate never doubles as "yes" to a charge.
alter table public.jobs
  add column if not exists expert_timeline_ack boolean not null default false;
