"use client";

import { useState } from "react";
import { initializeClient } from "@dynamic-labs-sdk/client";
import {
  useGetWalletAccounts,
  useInitStatus,
  useUser,
} from "@dynamic-labs-sdk/react-hooks";
import { DynamicLogin } from "@/components/dynamic/dynamic-login";
import { DynamicPending, DynamicStatus } from "@/components/dynamic/dynamic-status";
import { WalletAddress } from "@/components/dynamic/wallet-address";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CascadePayPanelProps {
  jobId: string;
  title: string;
  amountCents: number;
  treasuryAddress: string;
  status: string;
}

interface Result {
  tone: "ok" | "error";
  text: string;
}

const FUNDED_STATUSES = new Set(["settled", "paid", "funded"]);

function humanize(status: string): string {
  return status.replace(/_/g, " ");
}

/**
 * Funding confirmation for one job. Money is involved, so every branch says
 * where the funds are, which wallet they leave from, and what has and hasn't
 * happened yet.
 *
 * Must be rendered inside `DynamicProvider`.
 */
export function CascadePayPanel({
  jobId,
  title,
  amountCents,
  treasuryAddress,
  status,
}: CascadePayPanelProps) {
  const { data: initStatus, error: initError } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const amount = (amountCents / 100).toFixed(2);
  const address = accounts[0]?.address;
  const alreadyFunded = FUNDED_STATUSES.has(status);
  // The simulated treasury is a readable placeholder, not a real address —
  // don't offer an explorer link that would 404.
  const onChain = /^0x[0-9a-fA-F]{40}$/.test(treasuryAddress);

  async function confirmSandboxPayment() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dynamicWalletAddress: address,
          simulated: true,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error ?? "The request was rejected.");
      setResult({
        tone: "ok",
        text: "Escrow recorded. You’ll get a confirmation in your iMessage thread.",
      });
    } catch (error) {
      setResult({
        tone: "error",
        text: `${
          error instanceof Error ? error.message : "The request failed."
        } Nothing was moved — you can try again.`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="pay-heading"
      className="rounded-xl border border-hairline p-6 sm:p-8"
    >
      <p className="label-caps text-accent-ink">Escrow · sandbox</p>
      <h2 id="pay-heading" className="mt-6 font-secondary text-2xl sm:text-3xl">
        {title}
      </h2>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <dt className="label-caps text-muted-foreground">Amount</dt>
          <dd className="font-mono text-xl text-foreground">${amount} USDC</dd>
        </div>
        <div className="space-y-1.5">
          <dt className="label-caps text-muted-foreground">Status</dt>
          <dd className="text-sm text-foreground">{humanize(status)}</dd>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <dt className="label-caps text-muted-foreground">
            Escrow address — where the funds are held
          </dt>
          <dd className="text-sm">
            <WalletAddress
              address={treasuryAddress}
              label="Copy escrow address"
              explorer={onChain}
            />
          </dd>
        </div>
      </dl>

      <p className="mt-6 border-t border-hairline pt-4 text-sm leading-relaxed text-muted-foreground">
        Base Sepolia testnet — no real dollars move. The funds sit in escrow
        until the work is delivered, and nothing is charged until you confirm
        below.
      </p>

      <div className="mt-6 border-t border-hairline pt-6">
        {initStatus === "failed" ? (
          <DynamicStatus
            tone="error"
            title="Couldn’t reach the wallet service"
            description="You can’t confirm escrow until the wallet loads. Nothing has been charged."
            detail={initError?.message ?? null}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void initializeClient()}
              >
                Try again
              </Button>
            }
          />
        ) : initStatus !== "finished" ? (
          <DynamicPending label="Connecting to your wallet…" />
        ) : !user ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sign in to pay. Email only — a wallet is created for you, with no
              seed phrase to keep.
            </p>
            <DynamicLogin />
          </div>
        ) : (
          <div className="space-y-4">
            <dl className="space-y-4">
              <div className="space-y-1">
                <dt className="label-caps text-muted-foreground">Paying as</dt>
                <dd className="text-sm break-all text-foreground">
                  {user.email ?? "Signed in"}
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="label-caps text-muted-foreground">
                  From wallet
                </dt>
                <dd className="text-sm">
                  {address ? (
                    <WalletAddress address={address} />
                  ) : (
                    <span className="text-muted-foreground">
                      Creating your wallet… this usually takes a few seconds.
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={confirmSandboxPayment}
                disabled={busy || alreadyFunded}
              >
                {busy ? "Recording…" : "Confirm escrow"}
              </Button>
              {alreadyFunded ? (
                <p className="text-sm text-muted-foreground">
                  Already funded — nothing left to confirm.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {result ? (
          <p
            role="status"
            className={cn(
              "mt-4 text-sm leading-relaxed",
              result.tone === "error" ? "text-destructive" : "text-accent-ink"
            )}
          >
            {result.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
