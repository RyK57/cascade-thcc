-- Cascade track-win: HUD, escrow links, trust audits, bids, location, Agent Pay

alter table public.jobs
  add column if not exists status_card_is_rich boolean not null default false,
  add column if not exists wallet_refuse_count integer not null default 0,
  add column if not exists requester_lat double precision,
  add column if not exists requester_lng double precision;

alter table public.payments
  add column if not exists escrow_tx_hash text;

alter table public.users
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision;

-- Peer credit bids for second-price mini-auction
create table if not exists public.job_bids (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  peer_user_id uuid not null references public.users(id) on delete cascade,
  bid_credits integer not null,
  created_at timestamptz not null default now(),
  unique (job_id, peer_user_id)
);

create index if not exists job_bids_job_id_idx on public.job_bids (job_id);

-- Terac trust audits of peer deliverables
create table if not exists public.trust_audits (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  peer_user_id uuid not null references public.users(id) on delete cascade,
  terac_opportunity_id text,
  rating integer,
  trust_before integer,
  trust_after integer,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trust_audits_job_id_idx on public.trust_audits (job_id);
create index if not exists trust_audits_status_idx on public.trust_audits (status);

-- Lightweight before/after demo metrics
create table if not exists public.demo_metrics (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  before_value numeric,
  after_value numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_bids enable row level security;
alter table public.trust_audits enable row level security;
alter table public.demo_metrics enable row level security;
