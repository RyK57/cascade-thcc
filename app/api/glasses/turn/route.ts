import { NextResponse } from "next/server";
import { z } from "zod";
import { getLatestJobByHandle, updateJob } from "@/db/jobs";
import {
  AGENT_INTENT,
  clipTitle,
  interpretMessage,
  runAgentTurn,
} from "@/libs/agent";
import { captionImage, isRunwareConfigured } from "@/libs/runware";
import { JOB_STATUS } from "@/utils/schema/job";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/** Pre-funding states a fresh voice request may safely replace. */
const VOICE_REPLACEABLE = new Set<string>([
  JOB_STATUS.intake,
  JOB_STATUS.quoted,
  JOB_STATUS.paid,
  JOB_STATUS.cancelled,
  JOB_STATUS.draftReady,
  "open",
]);

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  /** E.164 phone of the glasses wearer (must have texted Cascade before). */
  handle: z.string().min(3),
  /** Transcribed voice command from the glasses mic. */
  text: z.string().optional(),
  /** Glasses camera capture as a data URI (data:image/jpeg;base64,...). */
  imageDataUri: z.string().optional(),
});

/**
 * Voice/vision turn from the iOS glasses companion app (Meta Wearables DAT).
 * Runs the same Cascade agent loop as an inbound iMessage; the reply also
 * lands in the wearer's iMessage thread, and is returned here for the glasses
 * to speak aloud via TTS.
 */
export async function POST(request: Request) {
  const token = process.env.GLASSES_TOKEN?.trim();
  if (token) {
    const provided = new URL(request.url).searchParams.get("token");
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { handle, imageDataUri } = parsed.data;
  let text = parsed.data.text?.trim() ?? "";

  if (!text && !imageDataUri) {
    return NextResponse.json(
      { error: "Provide text and/or imageDataUri" },
      { status: 400 }
    );
  }

  // Everything past validation can throw (Supabase, Runware, the agent's
  // final Linq send — which fails outright when Linq is unconfigured or the
  // sandbox daily cap trips). The glasses client can only speak JSON, so an
  // escaped throw must not become Next's HTML 500 page.
  try {
    // The wearer must have an existing Cascade thread (sandbox is inbound-first).
    const latestJob = await getLatestJobByHandle(handle);
    if (!latestJob) {
      return NextResponse.json(
        {
          reply:
            "I don't have a Cascade thread for this number yet — text the Cascade number once first.",
          ok: false,
        },
        { status: 404 }
      );
    }

    if (imageDataUri && isRunwareConfigured()) {
      const caption = await captionImage(
        imageDataUri,
        "Describe what the wearer of smart glasses is looking at, as context for a task request. Note objects, text, and problems visible."
      );
      if (caption) {
        text = text
          ? `${text}\n[Looking at: ${caption}]`
          : `[Looking at: ${caption}] Figure out what task I need from this.`;
      }
    }
    if (!text) {
      text = "I sent a photo from my glasses — ask me what I need done.";
    }

    // Voice from the glasses is almost always a NEW request. The iMessage
    // flow keys turns to the chat's current job, so a freeform utterance
    // while a job idles pre-funding reads as a status ping ("still open…").
    // Reset such jobs to intake so the voice text triages fresh; funded or
    // in-flight jobs are left untouched.
    const intent = interpretMessage(text);
    if (
      intent === AGENT_INTENT.freeform &&
      VOICE_REPLACEABLE.has(latestJob.status)
    ) {
      await updateJob(latestJob.id, {
        status: JOB_STATUS.intake,
        title: clipTitle(text),
        description: text,
      });
    }

    const result = await runAgentTurn({
      kind: "text",
      eventId: `glasses-turn:${crypto.randomUUID()}`,
      messageId: `glasses-turn:${crypto.randomUUID()}`,
      chatId: latestJob.linqChatId,
      senderHandle: handle,
      text,
    });

    // Voice-safe reply: TTS reading a URL (with a job UUID) is gibberish.
    // Strip links; the full link is already in the iMessage thread.
    const rawReply =
      result.reply ??
      "Done — check your Cascade thread in Messages for the details.";
    const hadLink = /https?:\/\/\S+/.test(rawReply);
    let reply = rawReply
      .replace(/https?:\/\/\S+/g, "")
      // Voice context: hands are busy, there is no message bubble to tapback.
      .replace(/tapback\s*❤️?\s*\/?\s*(or\s+reply\s+)?YES/gi, "say yes")
      .replace(/tapback\s+heart\s+to\s+approve/gi, "say yes to approve")
      .replace(/tapback\s*❤️/gi, "say yes")
      .replace(/thumbs-?down\s+to\s+reject/gi, "say no to reject")
      .replace(/👎\s*to\s+hold/gi, "or say no to hold")
      .replace(/first\s+tapback\s*❤️?\s+wins/gi, "first peer to claim wins")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim();
    if (hadLink) {
      reply = `${reply} I put the link in your Messages thread.`;
    }

    return NextResponse.json({
      ok: true,
      action: result.action,
      jobId: result.jobId,
      reply,
    });
  } catch (error) {
    console.error("[cascade] glasses turn failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Turn failed",
        reply:
          "Something went wrong handling that — try again in a moment, or text the Cascade number directly.",
      },
      { status: 500 }
    );
  }
}
