import { NextResponse } from "next/server";
import { getJobById } from "@/db/jobs";
import { getPaymentByJobId, updatePaymentStatus } from "@/db/payments";
import { settlePayment } from "@/libs/agent";
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
 * Sandbox fund confirm — marks payment settled and advances the job
 * (peer → funded+broadcast, expert → paid). No mainnet / real USD.
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
    escrowTxHash?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // empty body ok
  }

  const treasury = await ensureSandboxTreasury();
  const escrowTxHash = body.escrowTxHash ?? simulatedEscrowHash(payment.id);

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
    treasuryAddress: treasury.address,
    treasuryExplorerUrl: explorerAddressUrl(treasury.address),
    escrowTxHash,
    escrowExplorerUrl: explorerTxUrl(escrowTxHash),
    payment: settled,
    simulated: body.simulated ?? true,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const payment = await getPaymentByJobId(jobId);
  const treasury = await ensureSandboxTreasury();
  return NextResponse.json({
    job,
    payment,
    treasuryAddress: treasury.address,
    treasuryExplorerUrl: explorerAddressUrl(treasury.address),
    escrowExplorerUrl: payment?.escrowTxHash
      ? explorerTxUrl(payment.escrowTxHash)
      : null,
    mode: "sandbox",
    chain: "base-sepolia",
  });
}
