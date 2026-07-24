# YC Hackathon

Next.js hackathon starter cloned from `prototype-template`, pre-wired with:

- **Linq** (`@linqapp/sdk`) — messaging API
- **Terac** — verified human labor REST client
- **Dynamic** (`@dynamic-labs/sdk-react-core`) — wallet auth

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Env keys

| Integration | Variable |
|---|---|
| Linq | `LINQ_API_V3_API_KEY` |
| Terac | `TERAC_API_KEY` |
| Dynamic | `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` |

Get keys from:

- Linq: [docs.linqapp.com](https://docs.linqapp.com)
- Terac: [terac.com](https://terac.com) / MCP org dashboard
- Dynamic: [app.dynamic.xyz/dashboard/developer/api](https://app.dynamic.xyz/dashboard/developer/api)

## API routes

- `GET /api/health` — service + integration status
- `GET /api/integrations/status` — Linq / Terac / Dynamic configured?
- `POST /api/linq/chats` — `{ from, to[], text }`
- `GET /api/terac/opportunities` — list Terac opportunities

## App routes

- `/` — lander
- `/main` — integrations panel + Dynamic widget
- `/auth/*` — Supabase auth scaffold (optional)
- `/internal` — env / tooling dashboard

## Scripts

```bash
pnpm dev
pnpm build
pnpm test
```

## Structure

- `libs/linq/` · `libs/terac/` · `libs/dynamic/` — integration clients
- `components/dynamic/` — Dynamic provider + widget
- `app/api/linq/` · `app/api/terac/` — HTTP handlers
- `agents/` — prototype-template rules + skills
