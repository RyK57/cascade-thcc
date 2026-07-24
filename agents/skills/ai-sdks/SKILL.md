---
name: ai-sdks
description: OpenAI, Anthropic, and xAI SDK usage via libs/ai.
---

# AI SDKs

- Client factories: `libs/ai/providers/create-clients.ts`
- API keys from env — never hardcode
- Route handlers in `app/api/` call `libs/ai/` functions
- Prefer Vercel AI SDK (`ai` package) for streaming when building chat UIs
- xAI via `@ai-sdk/xai` + `createXaiProvider()`
- Validate inputs/outputs with Zod in `utils/schema/`
