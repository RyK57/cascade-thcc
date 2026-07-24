-- Proof that a phone belongs to the person using it. A number sitting in a
-- profile column only records what someone typed; this is set when a texted
-- link or code is actually redeemed, and it is what gates the agent.
alter table public.users
  add column if not exists phone_verified_at timestamptz;

-- Approvals are a decision about money, so they belong in the database rather
-- than being inferred from a message that happened to arrive. `approved_at`
-- doubles as the idempotency guard: a second heart on the same card finds the
-- job already approved and does not charge again.
alter table public.jobs
  add column if not exists approved_at timestamptz,
  add column if not exists approved_via text;
