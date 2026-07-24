import { createLinqClient } from "./client";
import { withRetryAfter } from "./rate-limit";

export async function createAgentPayRequest(params: {
  amountCents: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; checkoutUrl?: string }> {
  const client = createLinqClient();
  const created = await client.paymentRequests.create({
    amount: params.amountCents,
    currency: (params.currency ?? "usd").toLowerCase(),
    description: params.description,
    metadata: params.metadata,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = created as any;
  return {
    id: raw.id as string,
    checkoutUrl:
      raw.checkout_url ??
      raw.stripe?.checkout_url ??
      raw.natural?.checkout_url,
  };
}

export async function sendCheckoutLink(params: {
  chatId: string;
  checkoutUrl: string;
  caption: string;
  recipientKey?: string;
}): Promise<string> {
  const client = createLinqClient();
  const sent = await withRetryAfter(
    () =>
      client.chats.messages.send(params.chatId, {
        message: {
          parts: [
            { type: "text", value: params.caption },
            {
              type: "link",
              url: params.checkoutUrl,
              value: params.checkoutUrl,
            },
          ],
        },
      } as never),
    params.recipientKey ?? params.chatId
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (sent as any).message?.id ?? `out_${crypto.randomUUID()}`;
}
