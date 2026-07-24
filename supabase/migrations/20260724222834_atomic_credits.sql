-- Credit adjustment was a read-modify-write in application code: two
-- concurrent debits both read the same balance and the second write clobbered
-- the first, so the "insufficient credits" guard did not hold and the ledger
-- could disagree with users.credit_balance. Do the arithmetic and the guard in
-- one statement instead.

create or replace function public.adjust_user_credits(
  p_user_id uuid,
  p_delta integer
)
returns setof public.users
language plpgsql
as $$
begin
  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  return query
  update public.users
     set credit_balance = credit_balance + p_delta
   where id = p_user_id
     and credit_balance + p_delta >= 0
  returning *;

  if not found then
    raise exception 'insufficient_credits';
  end if;
end;
$$;

-- Backstop. NOT VALID so existing rows are not re-checked on deploy; new and
-- updated rows are.
alter table public.users
  drop constraint if exists users_credit_balance_nonneg;

alter table public.users
  add constraint users_credit_balance_nonneg
  check (credit_balance >= 0) not valid;
