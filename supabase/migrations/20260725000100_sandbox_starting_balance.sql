-- Sandbox stipend: every Cascade account starts with ~$100 of closed-loop
-- balance (1 credit ≈ $1). Not on-chain USDC.

alter table public.users
  alter column credit_balance set default 100;

-- Top up anyone still under the stipend (never reduce balances above 100).
-- Ledger first so the delta reflects the pre-update balance.
with needy as (
  select id, credit_balance
    from public.users
   where credit_balance < 100
     and not exists (
       select 1
         from public.ledger l
        where l.user_id = users.id
          and l.reason = 'sandbox_starting_balance'
     )
),
ledgered as (
  insert into public.ledger (user_id, delta_credits, reason)
  select id, 100 - credit_balance, 'sandbox_starting_balance'
    from needy
  returning user_id
)
update public.users u
   set credit_balance = 100
  from ledgered
 where u.id = ledgered.user_id;
