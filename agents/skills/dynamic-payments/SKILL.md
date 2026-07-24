---
name: dynamic-payments
description: Dynamic wallet auth and payment coordination for expert payouts/escrow in this iMessage hiring agent.
---

# Dynamic Payments Skill

## Role in this product

Dynamic is the **payment + wallet rail**. Linq handles conversation; Terac handles expert labor; Dynamic coordinates who pays, who gets paid, and wallet identity.

## Packages & env

- JS SDK (recommended): `@dynamic-labs-sdk/client`, `@dynamic-labs-sdk/evm`, `@dynamic-labs-sdk/react-hooks`
- Peer: `@tanstack/react-query` (wrap outside `DynamicProvider`)
- Client singleton: `libs/dynamic/dynamic-client.ts`
- UI: `components/dynamic/` (headless email OTP + wallet panel — no DynamicWidget)
- Config helpers: `libs/dynamic/config.ts`
- Env:
  - `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` (required)
  - `DYNAMIC_API_KEY` (server/dashboard API token — never expose to client)

## Patterns for this app

1. **Auth + wallet** — email OTP via hooks; WaaS bootstrap on `userChanged` with `createWaasWalletAccounts`
2. **Provider tree** — `QueryClientProvider` → `DynamicProvider` → `WaasBootstrap` in `components/dynamic/dynamic-provider.tsx`
3. **Server coordination** — payment intent state in Supabase (`db/payments/`); update from webhooks or authenticated API routes
4. **Chat mirror** — after a payment succeeds/fails, send a Linq message on the job thread
5. **Do not** make Stripe the primary path; leave Stripe scaffold unused unless explicitly requested
6. **Do not** reintroduce `@dynamic-labs/sdk-react-core` unless explicitly requested

## Security

- Only `NEXT_PUBLIC_*` values in client components
- `DYNAMIC_API_KEY` / auth tokens: server-only
- Verify any Dynamic webhooks/signatures before mutating payment state

## Suggested state machine (persist in DB)

```
payment_pending → wallet_connected → authorized → settled
                ↘ failed / cancelled
```

Tie rows to: `job_id`, `terac_submission_id`, `dynamic_user_id` / wallet address, amounts, currency.

## Docs MCP

`user-dynamic` is a **docs** MCP (search/query). Prefer it for API/setup questions; live wallet ops use the SDK + dashboard keys in `.env`.

- Dashboard: https://app.dynamic.xyz
- Docs: https://www.dynamic.xyz/docs
