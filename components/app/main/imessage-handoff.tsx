import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

/**
 * The agent's number, if this deployment has one. Same variables the outbound
 * sender reads (`libs/agent/broadcast-peers.ts`), so the panel can never
 * advertise a number the product can't actually answer on.
 */
export function getAgentNumber(): string | null {
  return (
    process.env.LINQ_FROM_NUMBER?.trim() ||
    process.env.LINQ_PHONE_NUMBER?.trim() ||
    null
  );
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
}

/**
 * The one thing an operator can actually do today. There is no in-app compose
 * box on purpose — the product rule is that jobs start in a real iMessage
 * thread the person opens themselves, never with outreach from us.
 */
export function IMessageHandoff({ number }: IMessageHandoffProps) {
  return (
    <section
      aria-labelledby="start-heading"
      className="relative overflow-hidden rounded-xl border border-hairline"
    >
      <div aria-hidden className="rules-mesh absolute inset-0 opacity-40" />
      <div className="relative p-6 sm:p-8">
        <p className="label-caps text-accent-ink">Start a job</p>

        {number ? (
          <>
            <h2
              id="start-heading"
              className="mt-6 font-secondary text-2xl sm:text-3xl"
            >
              Text {formatNumber(number)}
            </h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Describe the job the way you would to a colleague. The agent
              replies in the same thread, drafts a brief for free, and waits for
              your explicit yes before anything is launched or charged.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <a href={`sms:${number}`}>
                  <MessageSquare data-icon="inline-start" className="size-4" />
                  Open Messages
                </a>
              </Button>
              <CopyButton value={number} label="Copy the agent's number" />
            </div>
          </>
        ) : (
          <>
            <h2
              id="start-heading"
              className="mt-6 font-secondary text-2xl sm:text-3xl"
            >
              The agent’s number isn’t live here yet
            </h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              This deployment has no iMessage number connected, so there is
              nothing to text yet — and we’d rather show you that than print a
              number that won’t answer. Once one is connected it appears here,
              and every job you start in that thread lands on this page.
            </p>
            <div className="mt-6">
              <Button variant="outline" size="lg" asChild>
                <Link href={`${ROUTES.home}#how-it-works`}>
                  See how the loop works
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
