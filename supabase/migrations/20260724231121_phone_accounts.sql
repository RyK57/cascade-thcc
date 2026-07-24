-- Phone-first accounts.
--
-- Before this, three identities floated free: the iMessage phone (jobs), a
-- Supabase email/password login (web shell), and a Dynamic wallet (money).
-- Nothing proved the person funding a job was the person who texted it — the
-- pay URL itself was the only credential. These tables make the phone the
-- account and give the web app a session derived from it.

-- One-time credentials handed out in the iMessage thread: a magic-link token
-- (tapped) and/or a 6-digit code (typed on another device). Both are stored
-- hashed so a database read can never be replayed as a login.
create table if not exists public.account_links (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  user_id uuid references public.users(id) on delete cascade,
  -- sha256 of the raw token; the raw value only ever exists in the SMS
  token_hash text not null unique,
  -- sha256 of phone + code, null when the challenge is link-only
  code_hash text,
  -- Where to land after login. Keeps "pay this job" one tap from the thread.
  job_id uuid references public.jobs(id) on delete set null,
  purpose text not null default 'link',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  -- Guards code brute force; the link token is high-entropy and needs none.
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists account_links_phone_idx
  on public.account_links (phone, created_at desc);
create index if not exists account_links_expires_idx
  on public.account_links (expires_at);

-- Web sessions minted from a consumed challenge. Separate from Supabase auth:
-- these users have no password and may never have an email.
create table if not exists public.account_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  phone text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists account_sessions_phone_idx
  on public.account_sessions (phone, created_at desc);
create index if not exists account_sessions_expires_idx
  on public.account_sessions (expires_at);

-- Service-role only, like every other Cascade table: the web app reads these
-- through server code that already knows which phone the caller proved.
alter table public.account_links enable row level security;
alter table public.account_sessions enable row level security;
