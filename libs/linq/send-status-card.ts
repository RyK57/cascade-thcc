import { BRAND } from "@/lib/constants/branding";
import { checkIMessage } from "./check-imessage";
import { createLinqClient } from "./client";
import { sendChatMessage } from "./send-chat-message";
import { withRetryAfter } from "./rate-limit";

export interface StatusCardLayout {
  caption: string;
  subcaption?: string;
  trailingCaption?: string;
  imageUrl?: string;
}

export interface SendStatusCardParams {
  chatId: string;
  handle: string;
  layout: StatusCardLayout;
  /** Clean fallback — no dates/times/addresses. */
  fallbackText: string;
  idempotencyKey?: string;
  url?: string;
}

function formatPlainStatus(layout: StatusCardLayout, fallbackText: string): string {
  const lines = [layout.caption];
  if (layout.subcaption) lines.push(layout.subcaption);
  if (layout.trailingCaption) lines.push(layout.trailingCaption);
  lines.push(fallbackText);
  return lines.join("\n");
}

function getIMessageAppConfig():
  | { bundleId: string; teamId: string; name: string }
  | undefined {
  const bundleId = process.env.CASCADE_IMESSAGE_BUNDLE_ID?.trim();
  const teamId = process.env.CASCADE_IMESSAGE_TEAM_ID?.trim();
  if (!bundleId || !teamId) return undefined;
  return {
    bundleId,
    teamId,
    name: process.env.CASCADE_IMESSAGE_APP_NAME?.trim() || BRAND.name,
  };
}

function cardLayout(layout: StatusCardLayout) {
  return {
    caption: layout.caption,
    subcaption: layout.subcaption,
    trailing_caption: layout.trailingCaption,
    image_url: layout.imageUrl,
  };
}

/**
 * Prefer plain-text status lines (no Apple Messages extension required).
 * When CASCADE_IMESSAGE_* env is set and the handle supports iMessage,
 * send an imessage_app layout card with the same fallback_text.
 */
export async function sendStatusCard(
  params: SendStatusCardParams
): Promise<{ messageId: string; usedCard: boolean }> {
  const plain = formatPlainStatus(params.layout, params.fallbackText);
  const app = getIMessageAppConfig();
  const supports =
    app && params.handle ? await checkIMessage(params.handle) : false;
  const url = params.url ?? `https://cascade.local/job`;

  if (!app || !supports) {
    const sent = await sendChatMessage({
      chatId: params.chatId,
      text: plain,
      idempotencyKey: params.idempotencyKey,
      recipientKey: params.handle,
    });
    return {
      messageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
      usedCard: false,
    };
  }

  const client = createLinqClient();
  const sent = await withRetryAfter(
    () =>
      client.chats.messages.send(
        params.chatId,
        {
          message: {
            parts: [
              {
                type: "imessage_app",
                url,
                fallback_text: params.fallbackText,
                app: {
                  bundle_id: app.bundleId,
                  team_id: app.teamId,
                  name: app.name,
                },
                layout: cardLayout(params.layout),
              },
            ],
          },
        },
        params.idempotencyKey
          ? { idempotencyKey: params.idempotencyKey }
          : undefined
      ),
    params.handle
  );

  return {
    messageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
    usedCard: true,
  };
}

/**
 * Update-in-place when the prior message was an imessage_app card.
 * Linq returns a NEW message id — caller must persist it.
 * Falls back to a new plain-text status line otherwise.
 */
export async function updateStatusCard(params: {
  previousMessageId: string;
  chatId: string;
  handle: string;
  layout: StatusCardLayout;
  fallbackText: string;
  wasCard: boolean;
  url?: string;
}): Promise<{ messageId: string; usedCard: boolean }> {
  if (!params.wasCard) {
    return sendStatusCard({
      chatId: params.chatId,
      handle: params.handle,
      layout: params.layout,
      fallbackText: params.fallbackText,
      url: params.url,
    });
  }

  try {
    const client = createLinqClient();
    const updated = await client.messages.updateAppCard(params.previousMessageId, {
      url: params.url ?? `https://cascade.local/job`,
      fallback_text: params.fallbackText,
      layout: cardLayout(params.layout),
    });
    return {
      messageId:
        (updated as { id?: string }).id ??
        (updated as { message?: { id?: string } }).message?.id ??
        `out_${crypto.randomUUID()}`,
      usedCard: true,
    };
  } catch (error) {
    console.warn("[linq] status card update failed; sending text", error);
    return sendStatusCard({
      chatId: params.chatId,
      handle: params.handle,
      layout: params.layout,
      fallbackText: params.fallbackText,
      url: params.url,
    });
  }
}
