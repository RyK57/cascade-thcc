-- Jobs: one row per hiring conversation (Linq chat ↔ Terac opportunity ↔ payment)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  linq_chat_id text not null unique,
  requester_handle text not null,
  title text not null,
  description text,
  status text not null default 'intake',
  terac_opportunity_id text,
  terac_submission_id text,
  quoted_total_cents integer,
  quoted_currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Message log per job; linq_message_id unique for webhook idempotency
create table if not exists public.job_messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  linq_message_id text not null unique,
  direction text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists job_messages_job_id_idx on public.job_messages(job_id);

-- Dynamic payment coordination state
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  terac_submission_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'payment_pending',
  dynamic_wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_job_id_idx on public.payments(job_id);

-- Server-owned tables: RLS on with no policies; access via service role only
alter table public.jobs enable row level security;
alter table public.job_messages enable row level security;
alter table public.payments enable row level security;
