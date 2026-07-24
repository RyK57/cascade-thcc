import { AppShell } from "@/components/app/app-shell";
import { getAgentNumber, IMessageHandoff } from "./imessage-handoff";
import { WalletSection } from "./wallet-section";

/**
 * What lands on this page once the thread view is built. Written from the
 * product rules, not from data — there is nothing to read here yet and the
 * page should say so rather than mock something up.
 */
const INCOMING = [
  {
    term: "The brief",
    definition:
      "What you asked for, written back to you as the agent understood it, before anything is committed.",
  },
  {
    term: "The expert",
    definition:
      "Who picked the job up from the verified pool, and what they’re delivering.",
  },
  {
    term: "The payment",
    definition:
      "Held until you confirm. Drafting is free; a job only launches when you say yes in the thread.",
  },
] as const;

export function WorkspaceOverview() {
  const number = getAgentNumber();

  return (
    <AppShell className="py-12 sm:py-16">
      <div className="max-w-[58ch]">
        <p className="label-caps text-accent-ink">Workspace</p>
        <h1 className="mt-6 font-secondary text-4xl sm:text-5xl">
          Your hires will show up here
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every job starts as a text message, so this page follows the thread
          rather than replacing it. The view that reads your live jobs isn’t
          built yet — that’s deliberate, not broken, and there is nothing here
          waiting for your attention.
        </p>
      </div>

      <div className="mt-12">
        <IMessageHandoff number={number} />
      </div>

      <section aria-labelledby="incoming-heading" className="mt-16 sm:mt-20">
        <p className="label-caps text-muted-foreground">Coming to this page</p>
        <h2
          id="incoming-heading"
          className="mt-6 font-secondary text-2xl sm:text-3xl"
        >
          What you’ll see once a job is running
        </h2>
        <dl className="mt-8 max-w-3xl border-t border-hairline">
          {INCOMING.map((item) => (
            <div
              key={item.term}
              className="grid gap-1 border-b border-hairline py-5 sm:grid-cols-[13rem_1fr] sm:gap-6"
            >
              <dt className="text-sm font-medium text-foreground">
                {item.term}
              </dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">
                {item.definition}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <WalletSection />
    </AppShell>
  );
}
