# Cascade demo script — one thread, four tracks (~150s)

Narrate live on a real Linq Number. Sandbox only (Base Sepolia).

## Cold open (Linq + Game theory)

1. In a group or 1:1, text: `Need 5 landing variants rated by real people tonight`.
2. Point at the mutating **Cascade status HUD** (rich card when `CASCADE_IMESSAGE_*` is set; plain lines otherwise).
3. Call out the EV line on the card: `EV peer wins (peer $… vs expert $…)`.
4. Say: “Messaging is the UI — ❤️ launches, 👎 revises, typing = loading.”

## Fund (Dynamic agent wallet)

5. Open the pay link → Mission Control (`/main?job=…`).
6. Email login (no seed phrase) → **Fund USDC** into the Cascade **agent wallet**.
7. Emphasize: escrow is **held**, not paid to the worker yet. Card flips to **Funded · Agent wallet holding escrow**.
8. Optional Basescan link from the job status page (`/job/<id>`).

## Humans (Terac)

9. If peer path: first peer ❤️ claims; deliverable lands; short Terac trust audit fires.
10. If expert path: ❤️ launches Terac draft (free until confirm).
11. Slide: `pnpm exec tsx scripts/terac-feedback-job.ts` baseline → tweak triage once → `--phase=ingest` → `GET /api/internal/demo-metrics` before/after.

## Close (mechanism + payout)

12. Requester ❤️ approves deliverable → agent wallet **releases** USDC (not at fund time).
13. Card flips **Paid · released**. Confetti in-thread.
14. One-liner: “Incomplete info → priced with EV → routed → verified by humans → settled by the agent wallet — same bubble.”

## Track callouts (if judges ask)

| Track | Gesture |
|-------|---------|
| Linq | Mutating HUD + tapbacks + deep link `/job/…` |
| Dynamic | Agent wallet escrow hold → release on approve |
| Terac | Trust-audit ingest + feedback before/after metrics |
| Game theory | EV on card, claim race / second-price `bid N`, bluff→audit |
