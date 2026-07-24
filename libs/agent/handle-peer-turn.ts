import { listJobBids, secondPriceClear, upsertJobBid } from "@/db/bids";
import { claimJob, clearAssigneeAndReopen, updateJob } from "@/db/jobs";
import { createPayout, getPayoutByJobId } from "@/db/payouts";
import { buildPaymentQuote, quoteLine } from "@/libs/chain";
import { PAY_ASSET, type PayAsset } from "@/libs/dynamic/assets";
import {
  claimEscrowRelease,
  createPayment,
  getPaymentByJobId,
} from "@/db/payments";
import {
  adjustCredits,
  getUserByIdAdmin,
  listPeers,
  upsertUserByPhone,
} from "@/db/users";
import {
  getAgentWalletAddress,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";
import { payWorkerUsdc } from "@/libs/dynamic/pay-worker";
import { ensurePhoneWallet } from "@/libs/dynamic/phone-wallet";
import { explorerTxUrl } from "@/libs/dynamic/sandbox";
import { payoutFromTreasury } from "@/libs/dynamic/treasury";
import {
  createAgentPayRequest,
  sendCheckoutLink,
} from "@/libs/linq/payment-requests";
import { sendChatMessage } from "@/libs/linq";
import { FUNDED_VIA, JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { PAYOUT_STATUS } from "@/utils/schema/payout";
import { USER_ROLE } from "@/utils/schema/user";
import { broadcastJobToPeers } from "./broadcast-peers";
import { getPayUrl } from "./pay-url";
import {
  agentPayOfferReply,
  alreadyHaveBalanceNudge,
  claimEvLine,
  fallbackReply,
  fundedViaCreditsReply,
  peerClaimedPeerReply,
  peerClaimedRequesterReply,
  peerDeliveredRequesterReply,
  peerFundedReply,
  peerPaidReply,
  peerPayoutInFlightReply,
  peerQuoteReply,
  paymentPendingReply,
} from "./reply-templates";
import { claimExpectedCredits } from "./routing-ev";
import { HUD_STAGE, syncJobHud } from "./status-hud";
import {
  countPeerDeliverables,
  looksLikeBluff,
  shouldAuditDeliverable,
  startTrustAudit,
} from "./trust-audit";
import { AGENT_ACTION, AGENT_INTENT, type AgentAction, type AgentIntent } from "./types";

interface PeerTurn {
  job: Job;
  intent: AgentIntent;
  text: string;
  senderHandle: string;
  chatId: string;
}

interface PeerOutcome {
  action: AgentAction;
  reply: string;
  effect?: "confetti";
}

const BID_PATTERN = /^bid\s+(\d+)\s*$/i;
const WALLET_REFUSE_PATTERN =
  /\b(no wallet|refuse(d)?( wallet)?|don'?t want (a )?wallet|apple pay|skip wallet)\b/i;

export async function quotePeerJob(
  job: Job,
  asset: PayAsset = PAY_ASSET.usdc
): Promise<PeerOutcome> {
  const priceCents = job.priceUsdCents || 1200;
  await createPayment({
    jobId: job.id,
    amountCents: priceCents,
    currency: "usd",
    asset,
  });

  const updated = await updateJob(job.id, {
    status: JOB_STATUS.quoted,
    priceUsdCents: priceCents,
    quotedTotalCents: priceCents,
    quotedCurrency: "usd",
  });

  await syncJobHud(updated, HUD_STAGE.quoted);

  const requester = await ensurePhoneWallet(job.requesterHandle);
  const nudge =
    requester.creditBalance > 0 || requester.walletAddress
      ? `\n${alreadyHaveBalanceNudge()}`
      : "";

  // Spell out what actually leaves the wallet: the asset amount, what it's
  // worth right now, and the network fee on top.
  const quote = await buildPaymentQuote({ amountCents: priceCents, asset });

  return {
    action: AGENT_ACTION.quoted,
    reply:
      peerQuoteReply({
        title: job.title,
        priceCents,
        payUrl: getPayUrl(job.id),
        quoteLine: quoteLine(quote),
      }) + nudge,
  };
}

export async function handlePeerTurn(turn: PeerTurn): Promise<PeerOutcome> {
  const status =
    turn.job.status === JOB_STATUS.draftReady
      ? JOB_STATUS.quoted
      : turn.job.status;

  switch (status) {
    case JOB_STATUS.quoted:
    case JOB_STATUS.paymentPending:
      return handlePeerQuoted(turn);
    case JOB_STATUS.funded:
      return handlePeerFunded(turn);
    case JOB_STATUS.claimed:
      return handlePeerClaimed(turn);
    case JOB_STATUS.delivered:
      return handlePeerDelivered(turn);
    case JOB_STATUS.approved:
      return handlePeerApproved(turn);
    default:
      return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }
}

async function handlePeerQuoted(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, text } = turn;

  if (WALLET_REFUSE_PATTERN.test(text)) {
    const count = (job.walletRefuseCount ?? 0) + 1;
    await updateJob(job.id, { walletRefuseCount: count });
    if (count >= 2) {
      const amount = job.priceUsdCents || 1200;
      try {
        const pay = await createAgentPayRequest({
          amountCents: amount,
          description: `Cascade escrow for ${job.title}`,
          metadata: { job_id: job.id },
        });
        if (pay.checkoutUrl) {
          await sendCheckoutLink({
            chatId: job.linqChatId,
            checkoutUrl: pay.checkoutUrl,
            caption: agentPayOfferReply("Open the Apple Pay card below."),
            recipientKey: job.requesterHandle,
          });
          await updateJob(job.id, { fundedVia: FUNDED_VIA.agentpay });
          return {
            action: AGENT_ACTION.paymentPending,
            reply: agentPayOfferReply(pay.checkoutUrl),
          };
        }
      } catch (error) {
        console.warn("[cascade] Agent Pay create failed", error);
      }
      return {
        action: AGENT_ACTION.paymentPending,
        reply: agentPayOfferReply(
          "Agent Pay isn't available right now — use the Cascade wallet link."
        ),
      };
    }
    return {
      action: AGENT_ACTION.paymentPending,
      reply: `Wallet is still the fastest path (escrow + instant payout). Refuse once more to fall back to Agent Pay. ${paymentPendingReply(getPayUrl(job.id))}`,
    };
  }

  if (intent === AGENT_INTENT.payCredits) {
    const requester = await upsertUserByPhone({
      phone: job.requesterHandle,
      role: USER_ROLE.both,
    });
    const priceCredits = Math.max(
      1,
      Math.ceil((job.priceUsdCents || 1200) / 100)
    );
    if (requester.creditBalance < priceCredits) {
      return {
        action: AGENT_ACTION.paymentPending,
        reply: `Not enough balance (${requester.creditBalance}/${priceCredits}). ${paymentPendingReply(getPayUrl(job.id))}`,
      };
    }

    await adjustCredits({
      userId: requester.id,
      deltaCredits: -priceCredits,
      jobId: job.id,
      reason: "peer_job_payment",
    });
    const funded = await updateJob(job.id, {
      status: JOB_STATUS.funded,
      fundedVia: FUNDED_VIA.credits,
    });
    await syncJobHud(funded, HUD_STAGE.funded);
    await broadcastJobToPeers(funded);
    return {
      action: AGENT_ACTION.funded,
      reply: fundedViaCreditsReply(job.title),
    };
  }

  const payment = await getPaymentByJobId(job.id);
  if (payment?.status === PAYMENT_STATUS.settled) {
    return markPeerFunded(job);
  }

  return {
    action: AGENT_ACTION.paymentPending,
    reply: paymentPendingReply(getPayUrl(job.id)),
  };
}

export async function markPeerFunded(
  job: Job,
  explorerUrl?: string
): Promise<PeerOutcome> {
  // Already past fund — do not rebroadcast or rewrite status.
  if (
    job.status === JOB_STATUS.funded ||
    job.status === JOB_STATUS.claimed ||
    job.status === JOB_STATUS.delivered ||
    job.status === JOB_STATUS.approved ||
    job.status === JOB_STATUS.paid
  ) {
    const base = peerFundedReply(job.title);
    return {
      action: AGENT_ACTION.funded,
      reply: explorerUrl ? `${base}\n${explorerUrl}` : base,
    };
  }

  let funded = await updateJob(job.id, {
    status: JOB_STATUS.funded,
    fundedVia: job.fundedVia ?? FUNDED_VIA.wallet,
  });
  funded = await syncJobHud(funded, HUD_STAGE.funded);

  const peers = await listPeers();
  const avgTrust =
    peers.reduce((s, p) => s + p.trustScore, 0) / Math.max(1, peers.length);
  const ev = claimExpectedCredits({
    priceUsdCents: job.priceUsdCents || 1200,
    trustScore: avgTrust,
    competingPeers: Math.max(1, peers.length),
  });

  await broadcastJobToPeers(funded);
  const base = peerFundedReply(job.title, claimEvLine(ev));
  return {
    action: AGENT_ACTION.funded,
    reply: explorerUrl ? `${base}\n${explorerUrl}` : base,
  };
}

async function handlePeerFunded(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, text, senderHandle, chatId } = turn;

  const bidMatch = text.trim().match(BID_PATTERN);
  if (bidMatch && senderHandle !== job.requesterHandle) {
    const peer = await upsertUserByPhone({
      phone: senderHandle,
      role: USER_ROLE.peer,
    });
    await upsertJobBid({
      jobId: job.id,
      peerUserId: peer.id,
      bidCredits: Number(bidMatch[1]),
      chatId,
    });
    const bids = await listJobBids(job.id);
    if (bids.length >= 2) {
      const floor = Math.max(1, Math.ceil((job.priceUsdCents || 1200) / 200));
      const clear = secondPriceClear(bids, floor);
      // Award to the lowest bidder, not merely to whoever bid last. Gating on
      // `winnerUserId === peer.id` stalled every ordering where the lowest bid
      // wasn't the most recent one.
      if (clear) {
        const winnerChatId = clear.winnerBid.chatId ?? chatId;
        const claimed = await claimJob({
          jobId: job.id,
          assigneeUserId: clear.winnerUserId,
          claimChatId: winnerChatId,
        });
        if (claimed) {
          await syncJobHud(claimed, HUD_STAGE.claimed);
          const wonReply = `You won the auction at ${clear.priceCredits}. ${peerClaimedPeerReply(job.title)}`;

          if (clear.winnerUserId === peer.id) {
            return { action: AGENT_ACTION.claimed, reply: wonReply };
          }

          // The winner bid earlier in a different thread — tell them there.
          try {
            await sendChatMessage({
              chatId: winnerChatId,
              text: wonReply,
              idempotencyKey: `bid-win-${job.id}-${clear.winnerUserId}`,
            });
          } catch (error) {
            console.warn("Failed to notify auction winner", error);
          }

          return {
            action: AGENT_ACTION.statusReported,
            reply: `Bid recorded (${bidMatch[1]}) — someone bid lower and took this one. We'll ping you on the next match.`,
          };
        }
      }
    }
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Bid recorded (${bidMatch[1]}). Waiting on a second bid to clear the auction, or tapback ❤️ to claim it outright.`,
    };
  }

  if (intent !== AGENT_INTENT.affirm) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Still open — first tapback ❤️ wins the race (or text "bid N").`,
    };
  }

  if (senderHandle === job.requesterHandle && chatId === job.linqChatId) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Waiting for a peer to claim. I'll text you when someone does.`,
    };
  }

  const peer = await upsertUserByPhone({
    phone: senderHandle,
    role: USER_ROLE.peer,
  });
  await ensurePhoneWallet(senderHandle);

  const claimed = await claimJob({
    jobId: job.id,
    assigneeUserId: peer.id,
    claimChatId: chatId,
  });

  if (!claimed) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Someone else already claimed this one — thanks anyway.`,
    };
  }

  await syncJobHud(claimed, HUD_STAGE.claimed);
  const peerName = peer.fullName ?? senderHandle;
  try {
    await sendChatMessage({
      chatId: job.linqChatId,
      text: peerClaimedRequesterReply(peerName),
      idempotencyKey: `claim-notify-${job.id}`,
    });
  } catch (error) {
    console.warn("Failed to notify requester of claim", error);
  }

  return {
    action: AGENT_ACTION.claimed,
    reply: peerClaimedPeerReply(job.title),
  };
}

async function handlePeerClaimed(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, text, senderHandle } = turn;

  if (!job.assigneeUserId) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  const assignee = await getUserByIdAdmin(job.assigneeUserId);
  const isAssignee = assignee?.phone === senderHandle;

  if (isAssignee && intent === AGENT_INTENT.freeform) {
    const bluff = looksLikeBluff(text);
    const delivered = await updateJob(job.id, {
      status: JOB_STATUS.delivered,
      description: job.description
        ? `${job.description}\n\nDeliverable:\n${text}`
        : text,
    });
    await syncJobHud(delivered, HUD_STAGE.delivered);

    const warn = bluff
      ? "\n(Low-effort tell detected — routing to Terac trust audit.)"
      : "";

    try {
      await sendChatMessage({
        chatId: job.linqChatId,
        text: `Deliverable from ${assignee?.fullName ?? "peer"}:\n${text}\n\n${peerDeliveredRequesterReply()}${warn}`,
        idempotencyKey: `deliver-${job.id}-${Date.now()}`,
      });
    } catch (error) {
      console.warn("Failed to forward deliverable", error);
    }

    // shouldAuditDeliverable samples every Nth delivery, so it needs the peer's
    // running count — passing a literal 1 made any N > 1 disable audits.
    let deliverableCount = 1;
    if (assignee) {
      deliverableCount = await countPeerDeliverables(assignee.id).catch(() => 1);
    }

    if (assignee && (bluff || shouldAuditDeliverable(deliverableCount))) {
      try {
        await startTrustAudit({
          jobId: job.id,
          peerUserId: assignee.id,
          brief: job.description ?? job.title,
          deliverable: text,
          trustBefore: assignee.trustScore,
        });
      } catch (error) {
        console.warn("trust audit start failed", error);
      }
    }

    return {
      action: AGENT_ACTION.delivered,
      reply: `Forwarded to the requester.${bluff ? " Flagged for Terac audit." : ""}`,
    };
  }

  if (senderHandle === job.requesterHandle) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Peer is working on it — I'll forward their deliverable here.`,
    };
  }

  return {
    action: AGENT_ACTION.statusReported,
    reply: peerClaimedPeerReply(job.title),
  };
}

async function handlePeerDelivered(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, senderHandle } = turn;

  if (senderHandle !== job.requesterHandle) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Waiting on requester approval.`,
    };
  }

  if (intent === AGENT_INTENT.decline) {
    const reopened = await clearAssigneeAndReopen(job.id);
    await syncJobHud(reopened, HUD_STAGE.funded);
    await broadcastJobToPeers(reopened);
    return {
      action: AGENT_ACTION.rejectedWork,
      reply: `Rejected — reopened for another peer.`,
    };
  }

  if (intent !== AGENT_INTENT.affirm) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: peerDeliveredRequesterReply(),
    };
  }

  const approved = await updateJob(job.id, { status: JOB_STATUS.approved });
  return finalizePeerPayout(approved);
}

async function handlePeerApproved(turn: PeerTurn): Promise<PeerOutcome> {
  return finalizePeerPayout(turn.job);
}

/** Explorer URL for a recorded payout, or null when none exists yet. */
async function recordedPayoutUrl(jobId: string): Promise<string | null> {
  const payout = await getPayoutByJobId(jobId).catch((error) => {
    console.warn("[cascade] payout lookup failed", error);
    return null;
  });
  return payout ? explorerTxUrl(payout.txHash) : null;
}

function paidOutcome(explorerUrl: string | null): PeerOutcome {
  return {
    action: AGENT_ACTION.paid,
    reply: peerPaidReply(explorerUrl ?? "sandbox payout already sent"),
    effect: "confetti",
  };
}

export async function finalizePeerPayout(job: Job): Promise<PeerOutcome> {
  // Deliberately not swallowed: a failed read used to yield null, which skipped
  // the CAS below entirely and ran the payout unguarded.
  const payment = await getPaymentByJobId(job.id);

  // Idempotent: iMessage approve + Mission Control release must not double-pay.
  if (job.status === JOB_STATUS.paid) {
    return paidOutcome(await recordedPayoutUrl(job.id));
  }

  // escrow_released_at only means someone claimed the release slot — it is not
  // proof the transfer happened. A payout row is. Without one, a previous
  // release threw partway through (or is still in flight), so re-broadcasting
  // could double-pay and reporting success would be a lie.
  if (payment?.escrowReleasedAt) {
    const payoutUrl = await recordedPayoutUrl(job.id);
    if (!payoutUrl) {
      console.error(
        "[cascade] escrow release claimed with no payout recorded",
        job.id
      );
      return {
        action: AGENT_ACTION.errored,
        reply: peerPayoutInFlightReply(),
      };
    }
    // Payout landed; only the trailing status write failed. Finish the job.
    const settled = await updateJob(job.id, { status: JOB_STATUS.paid });
    await syncJobHud(settled, HUD_STAGE.paid).catch(() => undefined);
    return paidOutcome(payoutUrl);
  }

  // Claim the release slot before any on-chain transfer (CAS on escrow_released_at).
  if (payment) {
    const claimed = await claimEscrowRelease(payment.id);
    if (!claimed) {
      // Another caller won the race and is mid-release. Don't claim success
      // on their behalf — the confirmation follows from whoever is paying.
      return {
        action: AGENT_ACTION.errored,
        reply: peerPayoutInFlightReply(),
      };
    }
  }

  const amount = job.priceUsdCents || job.quotedTotalCents || 0;
  if (amount <= 0) {
    throw new Error(`Job ${job.id} has no payable amount`);
  }
  const assignee = job.assigneeUserId
    ? await getUserByIdAdmin(job.assigneeUserId)
    : null;
  const wallet =
    assignee?.walletAddress ||
    `0xpeer${(job.assigneeUserId ?? "unknown").replace(/-/g, "").slice(0, 32)}`;

  // Prefer Cascade agent wallet release; fall back to treasury stack.
  let explorerUrl: string;
  if (isAgentWalletConfigured() && getAgentWalletAddress()) {
    try {
      const payout = await payWorkerUsdc({ to: wallet, amountCents: amount });
      explorerUrl = payout.explorerUrl;
      // payWorkerUsdc writes no ledger row of its own, so without this the
      // agent-wallet path leaves no evidence the release happened.
      await createPayout({
        jobId: job.id,
        txHash: payout.txHash,
        amountUsdcCents: amount,
        status: PAYOUT_STATUS.broadcast,
      }).catch((error) => {
        console.error(
          "[cascade] agent wallet payout sent but not recorded",
          payout.txHash,
          error
        );
      });
    } catch (error) {
      console.warn(
        "[cascade] agent wallet payout failed; falling back to treasury",
        error
      );
      const payout = await payoutFromTreasury({
        jobId: job.id,
        toAddress: wallet,
        amountUsdcCents: amount,
      });
      explorerUrl = payout.explorerUrl;
    }
  } else {
    const payout = await payoutFromTreasury({
      jobId: job.id,
      toAddress: wallet,
      amountUsdcCents: amount,
    });
    explorerUrl = payout.explorerUrl;
  }

  if (job.assigneeUserId) {
    await adjustCredits({
      userId: job.assigneeUserId,
      deltaCredits: 1,
      jobId: job.id,
      reason: "peer_job_completed",
    });
  }

  const paid = await updateJob(job.id, { status: JOB_STATUS.paid });
  await syncJobHud(paid, HUD_STAGE.paid);

  if (job.claimChatId) {
    try {
      await sendChatMessage({
        chatId: job.claimChatId,
        text: `Payout complete (sandbox): ${explorerUrl}`,
        effect: "confetti",
        idempotencyKey: `payout-peer-${job.id}`,
      });
    } catch (error) {
      console.warn("Failed to notify peer of payout", error);
    }
  }

  return {
    action: AGENT_ACTION.paid,
    reply: peerPaidReply(explorerUrl),
    effect: "confetti",
  };
}
