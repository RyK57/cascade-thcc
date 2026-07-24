import { NextResponse } from "next/server";
import { getJobById } from "@/db/jobs";
import { getPaymentByJobId, updatePaymentStatus } from "@/db/payments";
import { settlePayment } from "@/libs/agent";
import {
  getAgentWalletAddress,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";
import { explorerAddressUrl, explorerTxUrl } from "@/libs/dynamic/sandbox";
import { ensureSandboxTreasury } from "@/libs/dynamic/treasury";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

function simulatedEscrowHash(paymentId: string): string {
  const compact = paymentId.replace(/-/g, "").slice(0, 36);
  return `0xesc${compact.padEnd(36, "0")}`;
}

/**
 * Sandbox fund confirm — locks escrow in the Cascade agent wallet (or treasury
 * fallback). Peer → funded+broadcast (no worker pay). Expert → paid.
 * Accepts a real Base Sepolia `txHash` from Mission Control when available.
 */
export async function POST(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const payment = await getPaymentByJobId(jobId);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  let body: {
    dynamicWalletAddress?: string;
    simulated?: boolean;
    txHash?: string;
    escrowTxHash?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // empty body ok
  }

  const agentAddress = getAgentWalletAddress();
  const treasury = await ensureSandboxTreasury();
  const escrowAddress = agentAddress ?? treasury.address;
  const escrowTxHash =
    body.txHash ?? body.escrowTxHash ?? simulatedEscrowHash(payment.id);

  // Keep a wallet_connected breadcrumb when address provided before settle.
  if (body.dynamicWalletAddress && payment.status === PAYMENT_STATUS.pending) {
    await updatePaymentStatus(
      payment.id,
      PAYMENT_STATUS.walletConnected,
      body.dynamicWalletAddress
    ).catch(() => undefined);
  }

  const settled = await settlePayment({
    paymentId: payment.id,
    status: PAYMENT_STATUS.settled,
    dynamicWalletAddress: body.dynamicWalletAddress,
    escrowTxHash,
  });

  return NextResponse.json({
    ok: true,
    mode: "sandbox",
    chain: "base-sepolia",
    agentWalletConfigured: isAgentWalletConfigured(),
    agentWalletAddress: agentAddress ?? null,
    treasuryAddress: treasury.address,
    escrowAddress,
    treasuryExplorerUrl: explorerAddressUrl(escrowAddress),
    escrowTxHash,
    escrowExplorerUrl: explorerTxUrl(escrowTxHash),
    payment: settled,
    simulated: !body.txHash && (body.simulated ?? true),
    txHash: body.txHash,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const payment = await getPaymentByJobId(jobId);
  const agentAddress = getAgentWalletAddress();
  const treasury = await ensureSandboxTreasury();
  const escrowAddress = agentAddress ?? treasury.address;
  return NextResponse.json({
    job,
    payment,
    agentWalletConfigured: isAgentWalletConfigured(),
    agentWalletAddress: agentAddress ?? null,
    treasuryAddress: treasury.address,
    escrowAddress,
    treasuryExplorerUrl: explorerAddressUrl(escrowAddress),
    escrowExplorerUrl: payment?.escrowTxHash
      ? explorerTxUrl(payment.escrowTxHash)
      : null,
    mode: "sandbox",
    chain: "base-sepolia",
  });
}
