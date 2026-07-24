"use client";

import { useGetWalletAccounts, useInitStatus, useUser } from "@dynamic-labs-sdk/react-hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicLogin } from "@/components/dynamic/dynamic-login";
import type { Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { PayButton } from "./pay-button";

interface CheckoutCardProps {
  job: Job;
  payment: Payment | null;
  agentAddress?: string;
  workerAddress?: string;
  onEscrowTx: (txHash: string) => void;
  onPayoutTx: (txHash: string) => void;
  onPayingOut: (paying: boolean) => void;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === PAYMENT_STATUS.settled) return "default";
  if (status === PAYMENT_STATUS.authorized) return "secondary";
  return "outline";
}

export function CheckoutCard({
  job,
  payment,
  agentAddress,
  workerAddress,
  onEscrowTx,
  onPayoutTx,
  onPayingOut,
}: CheckoutCardProps) {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();

  const amountCents = payment?.amountCents ?? job.quotedTotalCents ?? 0;
  const amountLabel = `$${(amountCents / 100).toFixed(2)}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span>{job.title}</span>
          {payment ? (
            <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.description ? (
          <p className="text-sm text-muted-foreground">{job.description}</p>
        ) : null}
        <p className="text-sm">
          Amount due:{" "}
          <span className="font-medium text-foreground">{amountLabel} USDC</span>{" "}
          <span className="text-muted-foreground">(Base Sepolia testnet)</span>
        </p>

        {initStatus !== "finished" ? (
          <p className="text-sm text-muted-foreground">Loading wallet…</p>
        ) : !user ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sign in to pay from your embedded wallet:
            </p>
            <DynamicLogin />
          </div>
        ) : payment && payment.status === PAYMENT_STATUS.settled ? (
          <p className="text-sm text-muted-foreground">
            This job is paid and closed. ✓
          </p>
        ) : payment ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Wallet:{" "}
              <code className="text-foreground">
                {accounts[0]?.address ?? "creating…"}
              </code>
            </p>
            <PayButton
              jobId={job.id}
              paymentId={payment.id}
              amountCents={amountCents}
              agentAddress={agentAddress}
              workerAddress={workerAddress}
              onEscrowTx={onEscrowTx}
              onPayoutTx={onPayoutTx}
              onPayingOut={onPayingOut}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment is due on this job yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
