import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import { getLinqFromNumber } from "@/libs/linq/from-number";

/**
 * The agent's number, if this deployment has one. Same variables the outbound
 * sender reads (`libs/agent/broadcast-peers.ts`), so the panel can never
 * advertise a number the product can't actually answer on.
 */
export function getAgentNumber(): string | null {
  return getLinqFromNumber() ?? null;
}

function formatNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

interface IMessageHandoffProps {
  number: string | null;
  linkedPhone?: string;
}

export function getMessagesStatus(
  number: string | null,
  linkedPhone?: string
): "Linked" | "Live" | "Unavailable" {
  if (linkedPhone) return "Linked";
  return number ? "Live" : "Unavailable";
}

/**
 * Messages channel panel. Jobs start when the person texts Cascade —
 * this is a handoff control, not a marketing CTA.
 */
export function IMessageHandoff({
  number,
  linkedPhone,
}: IMessageHandoffProps) {
  const status = getMessagesStatus(number, linkedPhone);

  return (
    <Card size="sm" className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle as="h2">Messages</CardTitle>
          <Badge variant={status === "Unavailable" ? "outline" : "secondary"}>
            {status}
          </Badge>
        </div>
        <CardDescription>
          Start and manage jobs in iMessage. Cascade only replies in threads you
          open.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {number ? (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agent number</p>
              <p className="font-mono text-sm">{formatNumber(number)}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Describe the job in the thread. Drafts are free; launch and payout
              wait for your explicit confirmation.
            </p>
          </>
        ) : linkedPhone ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your verified phone, {formatNumber(linkedPhone)}, is linked.
              Continue managing jobs in your existing Cascade thread.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Texting isn’t wired in this environment. Open a payment link from
            Messages when you have one, or connect your wallet so checkout is
            ready.
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-start gap-2">
        {number ? (
          <>
            <Button size="sm" asChild>
              <a href={`sms:${number}`}>
                <MessageSquare data-icon="inline-start" className="size-4" />
                Open Messages
              </a>
            </Button>
            <CopyButton value={number} label="Copy number" />
          </>
        ) : linkedPhone ? (
          <Button size="sm" asChild>
            <a href="sms:">
              <MessageSquare data-icon="inline-start" className="size-4" />
              Open Messages
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`${ROUTES.home}#how-it-works`}>How it works</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
