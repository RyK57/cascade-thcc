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
  treasuryExplorerUrl?: string;
  escrowExplorerUrl?: string | null;
  status: string;
}

export function CascadePayPanel({
  jobId,
  title,
  amountCents,
  treasuryAddress,
  treasuryExplorerUrl,
  escrowExplorerUrl,
  status,
}: CascadePayPanelProps) {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastEscrowUrl, setLastEscrowUrl] = useState<string | null>(
    escrowExplorerUrl ?? null
  );

  const amount = (amountCents / 100).toFixed(2);
  const address = accounts[0]?.address;

  async function confirmSandboxPayment() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dynamicWalletAddress: address,
          simulated: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        escrowExplorerUrl?: string;
        escrowTxHash?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Fund failed");
      if (data.escrowExplorerUrl) setLastEscrowUrl(data.escrowExplorerUrl);
      setMessage(
        data.escrowExplorerUrl
          ? `Sandbox escrow recorded. ${data.escrowExplorerUrl}`
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
          Treasury:{" "}
          {treasuryExplorerUrl ? (
            <a
              className="text-foreground underline"
              href={treasuryExplorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              {treasuryAddress}
            </a>
          ) : (
            <code className="text-foreground">{treasuryAddress}</code>
          )}
        </p>
        {lastEscrowUrl ? (
          <p className="text-muted-foreground">
            Escrow tx:{" "}
            <a
              className="text-foreground underline"
              href={lastEscrowUrl}
              target="_blank"
              rel="noreferrer"
            >
              Basescan
            </a>
          </p>
        ) : null}
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
