import { DynamicAuthPanel } from "@/components/dynamic/dynamic-auth-panel";
import { DynamicProvider } from "@/components/dynamic/dynamic-provider";

/**
 * The only place on `/main` that touches the Dynamic SDK, and the reason the
 * provider is mounted here instead of in the root layout.
 */
export function WalletSection() {
  return (
    <section
      aria-labelledby="wallet-heading"
      className="mt-16 sm:mt-20"
    >
      <p className="label-caps text-muted-foreground">Payments</p>
      <h2 id="wallet-heading" className="mt-6 font-secondary text-2xl sm:text-3xl">
        Your wallet
      </h2>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
        Dynamic is the payment rail. Sign in with email — an embedded wallet is
        created for you, no seed phrase. You fund the Cascade agent wallet
        escrow; worker payout releases only after you approve in iMessage.
      </p>

      <div className="mt-6 max-w-xl rounded-xl border border-hairline p-5 sm:p-6">
        <DynamicProvider>
          <DynamicAuthPanel />
        </DynamicProvider>
      </div>
    </section>
  );
}
