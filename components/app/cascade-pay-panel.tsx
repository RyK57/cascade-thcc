"use client";

import { useState } from "react";
import {
  useGetWalletAccounts,
  useInitStatus,
  useUser,
} from "@dynamic-labs-sdk/react-hooks";
import { DynamicAuthPanel } from "@/components/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/constants/branding";

interface CascadePayPanelProps {
  jobId: string;
  title: string;
  amountCents: number;
  treasuryAddress: string;
  status: string;
}

export function CascadePayPanel({
  jobId,
  title,
  amountCents,
  treasuryAddress,
  status,
}: CascadePayPanelProps) {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const amount = (amountCents / 100).toFixed(2);
  const address = accounts[0]?.address;

  /**
   * Try a real Base Sepolia USDC transfer from the embedded wallet to the
   * treasury; fall back to a simulated escrow record when the wallet has no
   * testnet funds (or the chain isn't enabled for this environment).
   */
  async function signOnchainEscrow(): Promise<string | null> {
    const walletAccount = accounts[0];
    if (!walletAccount) return null;
    try {
      const [{ createWalletClientForWalletAccount }, viem, chains] =
        await Promise.all([
          import("@dynamic-labs-sdk/evm/viem"),
          import("viem"),
          import("viem/chains"),
        ]);
      const walletClient = await createWalletClientForWalletAccount({
        walletAccount: walletAccount as never,
      });
      const txHash = await walletClient.sendTransaction({
        chain: chains.baseSepolia,
        account: walletClient.account,
        to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        data: viem.encodeFunctionData({
          abi: viem.erc20Abi,
          functionName: "transfer",
          args: [
            treasuryAddress as `0x${string}`,
            viem.parseUnits((amountCents / 100).toFixed(2), 6),
          ],
        }),
        value: BigInt(0),
      });
      return txHash;
    } catch (error) {
      console.warn("On-chain escrow failed; falling back to simulated", error);
      return null;
    }
  }

  async function confirmSandboxPayment() {
    setBusy(true);
    setMessage(null);
    try {
      const txHash = await signOnchainEscrow();
      const res = await fetch(`/api/jobs/${jobId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dynamicWalletAddress: address,
          simulated: !txHash,
          txHash: txHash ?? undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Fund failed");
      setMessage(
        txHash
          ? `Escrow broadcast on Base Sepolia (${txHash.slice(0, 10)}…). Cascade will text your iMessage thread.`
          : "Sandbox escrow recorded. Cascade will text your iMessage thread."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fund failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{BRAND.name} sandbox pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Job: <span className="font-medium text-foreground">{title}</span>
        </p>
        <p>
          Amount:{" "}
          <span className="font-medium text-foreground">${amount} USDC</span>{" "}
          on Base Sepolia (testnet — no real dollars).
        </p>
        <p className="text-muted-foreground">
          Treasury: <code className="text-foreground">{treasuryAddress}</code>
        </p>
        <p className="text-muted-foreground">Status: {status}</p>

        {initStatus !== "finished" ? (
          <p className="text-muted-foreground">Loading Dynamic…</p>
        ) : !user ? (
          <div className="space-y-2">
            <p>
              Fastest way to pay: your Cascade wallet — email only, no seed
              phrase.
            </p>
            <DynamicAuthPanel />
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              Signed in as{" "}
              <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <p className="text-muted-foreground">
              Wallet: <code className="text-foreground">{address ?? "creating…"}</code>
            </p>
            <Button
              onClick={confirmSandboxPayment}
              disabled={busy || status === "settled" || status === "paid"}
            >
              {busy ? "Recording…" : "Confirm sandbox escrow"}
            </Button>
          </div>
        )}

        {message ? <p className="text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
