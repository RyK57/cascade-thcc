"use client";

import { useGetWalletAccounts, useInitStatus, useUser } from "@dynamic-labs-sdk/react-hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicLogin } from "@/components/dynamic/dynamic-login";
import { labelPaymentStatus } from "@/lib/constants/status-labels";
import { JOB_STATUS } from "@/utils/schema/job";
import type { Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { PayButton } from "./pay-button";

interface CheckoutCardProps {
  job: Job;
  payment: Payment | null;
  agentAddress?: string;
  onEscrowTx: (txHash: string) => void;
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
  onEscrowTx,
}: CheckoutCardProps) {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();

  const amountCents = payment?.amountCents ?? job.quotedTotalCents ?? 0;
  const amountLabel = `$${(amountCents / 100).toFixed(2)}`;
  const escrowHeld =
    payment?.status === PAYMENT_STATUS.authorized ||
    payment?.status === PAYMENT_STATUS.settled ||
    job.status === JOB_STATUS.funded ||
    job.status === JOB_STATUS.claimed ||
    job.status === JOB_STATUS.delivered ||
    job.status === JOB_STATUS.approved;
  const jobPaid = job.status === JOB_STATUS.paid;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span>{job.title}</span>
          {payment ? (
            <Badge variant={statusVariant(payment.status)}>
              {labelPaymentStatus(payment.status)}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.description ? (
          <p className="text-sm text-muted-foreground">{job.description}</p>
        ) : null}
        <p className="text-sm">
          Amount due:{" "}
          <span className="font-medium text-foreground">{amountLabel} USDC</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Funds stay in escrow until you approve the work in Messages.
        </p>

        {initStatus !== "finished" ? (
          <p className="text-sm text-muted-foreground">Loading wallet…</p>
        ) : !user ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sign in to fund escrow from your wallet:
            </p>
            <DynamicLogin />
          </div>
        ) : jobPaid ? (
          <p className="text-sm text-muted-foreground">
            This job is paid and closed.
          </p>
        ) : escrowHeld ? (
          <p className="text-sm text-muted-foreground">
            Escrow is held. Approve the deliverable in Messages to release
            payment.
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
              onEscrowTx={onEscrowTx}
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
