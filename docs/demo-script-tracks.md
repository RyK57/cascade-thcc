# Cascade demo script — four tracks

Narrate live gestures on the Linq Number. Sandbox only (Base Sepolia).

## Track 1 — Linq (status HUD + tapbacks)

1. Text a peer-shaped ask: `Need someone nearby campus to pick up a package in 30 min`.
2. Point at the in-thread **Cascade · Quoted** status card (or plain-text fallback lines).
3. Say: “Tapback ❤️ to approve after funding, 👎 to reject.”
4. After escrow, show the card flip to **Funded → Claimed → Delivered → Paid**.
5. Optional: 👎 a weak deliverable to reopen the race.

## Track 2 — Dynamic (escrow star)

1. Open the pay link from the quote (`/main?job=…`).
2. Sign in with email (no seed phrase). Hit **Confirm sandbox escrow**.
3. Show Basescan links for treasury + escrow hash in the panel and iMessage.
4. On peer approval, show payout explorer URL in the peer thread.
5. Mention phone-keyed wallets: first inbound pre-creates a sandbox address.

## Track 3 — Terac (filters + trust audit)

1. Text an expert ask: `Need a senior eng to review our Stripe webhook design`.
2. Quote shows **Senior engineer · $X · ETA**; ❤️ launches Terac (drafts are free).
3. When a peer deliverable lands, note the short Terac trust audit (rate 1–5).
4. Broadcast copy: high-trust peers get the job first; others hear “priority queue.”
5. Optional operator step: `pnpm exec tsx scripts/terac-feedback-job.ts` for before/after `demo_metrics`.

## Track 4 — Game theory

1. On triage, call out the one-liner: `Cascade EV: peer $… beats expert $…`.
2. After funding: claim race + EV of claiming now; losers get “already claimed.”
3. Peer texts `bid 8` then another `bid 12` → second-price clear in credits.
4. Bluff: peer sends `done` → Cascade flags Terac audit + warns requester.
5. Wallet refuse twice (`no wallet` / `apple pay`) → Agent Pay backup offer only then.
