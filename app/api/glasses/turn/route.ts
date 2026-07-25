import { NextResponse } from "next/server";
import { z } from "zod";
import { getJobById, getLatestJobByHandle, updateJob } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { settlePayment } from "@/libs/agent";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import {
  AGENT_INTENT,
  clipTitle,
  interpretMessage,
  runAgentTurn,
} from "@/libs/agent";
import { captionImage, isRunwareConfigured } from "@/libs/runware";
import { JOB_STATUS } from "@/utils/schema/job";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/**
 * States a fresh voice request may replace. DEMO MODE: includes funded/
 * claimed so back-to-back voice tasks never wedge on "waiting for a peer" —
 * sandbox escrow only, nothing real is stranded.
 */
const VOICE_REPLACEABLE = new Set<string>([
  JOB_STATUS.intake,
  JOB_STATUS.quoted,
  JOB_STATUS.funded,
  JOB_STATUS.claimed,
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
  /** Wearer's current location — flows into peer broadcasts + proximity. */
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
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
  const { handle, imageDataUri, lat, lng } = parsed.data;
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

    // Voice escape hatch: "Cascade, reset" cancels whatever is in flight so
    // the next utterance starts clean — no DB surgery mid-demo.
    if (/^\s*(reset|restart|start over|cancel (that|it|the task))\s*[.!]?\s*$/i.test(text)) {
      await updateJob(latestJob.id, { status: JOB_STATUS.cancelled });
      return NextResponse.json({
        ok: true,
        jobId: latestJob.id,
        reply: "Fresh start — what do you need?",
      });
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

    // Persist wearer location so peer broadcasts carry a maps link and
    // proximity sorting kicks in.
    if (lat !== undefined && lng !== undefined) {
      await updateJob(latestJob.id, {
        requesterLat: lat,
        requesterLng: lng,
      }).catch(() => undefined);
    }

    const result = await runAgentTurn({
      kind: "text",
      eventId: `glasses-turn:${crypto.randomUUID()}`,
      messageId: `glasses-turn:${crypto.randomUUID()}`,
      chatId: latestJob.linqChatId,
      senderHandle: handle,
      text,
    });

    // DEMO MODE: hands-free flows shouldn't detour through the pay page —
    // auto-settle sandbox escrow the moment a glasses turn parks a job in
    // payment_pending. Peer jobs broadcast, expert jobs close paid, confetti
    // lands in the thread.
    let autoSettled = false;
    if (result.jobId) {
      const job = await getJobById(result.jobId);
      if (job?.status === JOB_STATUS.paymentPending) {
        const payment = await getPaymentByJobId(job.id);
        if (payment) {
          await settlePayment({
            paymentId: payment.id,
            status: PAYMENT_STATUS.settled,
          });
          autoSettled = true;
        }
      }
    }

    // Voice-safe reply: TTS reading a URL (with a job UUID) is gibberish.
    // Strip links; the full link is already in the iMessage thread.
    const rawReply = autoSettled
      ? "Escrow settled in sandbox — you're all set. It's live now."
      : result.reply ??
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

    // Mirror the reply onto the glasses HUD ("the real method": text on the
    // display). Same upsert trick as live captions; HUD polls it every 1s.
    if (result.jobId) {
      const { createAdminClient } = await import("@/utils/supabase/admin");
      await createAdminClient()
        .from("job_messages")
        .upsert(
          {
            job_id: result.jobId,
            linq_message_id: `live-reply:${handle}`,
            direction: "outbound",
            body: reply,
            created_at: new Date().toISOString(),
          },
          { onConflict: "linq_message_id" }
        );
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
