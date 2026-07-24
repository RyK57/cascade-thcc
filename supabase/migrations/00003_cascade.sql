-- Cascade: three-tier jobs (ai / peer / expert), peer credits, sandbox payouts

-- Expand users for phone-keyed peers and credit ledger
alter table public.users
  add column if not exists phone text,
  add column if not exists role text not null default 'requester',
  add column if not exists credit_balance integer not null default 0,
  add column if not exists wallet_address text,
  add column if not exists trust_score integer not null default 50;

create unique index if not exists users_phone_uidx
  on public.users (phone)
  where phone is not null;

-- Map legacy expert draft status → quoted
update public.jobs set status = 'quoted' where status = 'draft_ready';

alter table public.jobs
  add column if not exists tier text,
  add column if not exists price_usd_cents integer,
  add column if not exists assignee_user_id uuid references public.users(id),
  add column if not exists status_card_message_id text,
  add column if not exists funded_via text,
  add column if not exists claim_chat_id text,
  add column if not exists triage_reason text,
  add column if not exists terac_task_url text;

create index if not exists jobs_tier_status_idx on public.jobs (tier, status);
create index if not exists jobs_assignee_user_id_idx on public.jobs (assignee_user_id);
create index if not exists jobs_status_card_message_id_idx on public.jobs (status_card_message_id);

-- Credit ledger (closed-loop peer credits — never converts to crypto/fiat)
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delta_credits integer not null,
  job_id uuid references public.jobs(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists ledger_user_id_idx on public.ledger (user_id);
create index if not exists ledger_job_id_idx on public.ledger (job_id);

-- Sandbox Dynamic payouts (Base Sepolia or simulated)
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  tx_hash text not null,
  amount_usdc_cents integer not null,
  status text not null default 'simulated',
  created_at timestamptz not null default now()
);

create index if not exists payouts_job_id_idx on public.payouts (job_id);

-- Agent treasury wallet metadata (key shares stay in env secrets)
create table if not exists public.treasury_wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  chain_id integer not null default 84532,
  wallet_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ledger enable row level security;
alter table public.payouts enable row level security;
alter table public.treasury_wallets enable row level security;
