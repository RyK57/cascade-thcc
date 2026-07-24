-- Hackathon win: EV summary on jobs + escrow hold/release timestamps

alter table public.jobs
  add column if not exists ev_summary text;

alter table public.payments
  add column if not exists escrow_held_at timestamptz,
  add column if not exists escrow_released_at timestamptz;
