"use client";

import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import {
  useGetNativeBalance,
  useGetWalletAccounts,
  useUser,
} from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { DynamicLogoutButton } from "./dynamic-logout-button";
import { DynamicStatus } from "./dynamic-status";
import { WalletAddress } from "./wallet-address";

/**
 * The wallet, once someone is signed in. It has to answer three questions at a
 * glance — whose account is this, which address holds the money, and how much
 * is in it — and say plainly that nothing leaves without a confirmation.
 *
 * Rendered inside `DynamicProvider`, below `DynamicAuthPanel`'s init gate, so
 * init status is already settled here.
 */
export function DynamicDashboard() {
  const { data: user } = useUser();
  const { data: accounts = [], isLoading: loadingAccounts } =
    useGetWalletAccounts();

  // Only the EVM extension is registered, and the balance hook is typed against
  // that chain — narrow rather than cast.
  const evmAccount = accounts.find(
    (account): account is EvmWalletAccount => account.chain === "EVM"
  );
  const walletAccount = evmAccount ?? accounts[0];

  const {
    data: balance,
    isLoading: loadingBalance,
    isError: balanceFailed,
    refetch: refetchBalance,
  } = useGetNativeBalance({ walletAccount: evmAccount });

  if (!user) {
    return (
      <DynamicStatus
        tone="muted"
        title="Signed out"
        description="Your wallet session ended. Sign in again with your email to bring it back."
      />
    );
  }

  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        <div className="space-y-1">
          <dt className="label-caps text-muted-foreground">Account</dt>
          <dd className="text-sm break-all text-foreground">
            {user.email ?? "Signed in"}
          </dd>
        </div>

        <div className="space-y-1.5">
          <dt className="label-caps text-muted-foreground">
            Wallet address — holds your funds
          </dt>
          <dd className="text-sm">
            {walletAccount ? (
              <WalletAddress address={walletAccount.address} />
            ) : loadingAccounts ? (
              <span
                aria-hidden
                className="block h-6 w-44 animate-pulse rounded-sm bg-foreground/10"
              />
            ) : (
              <span className="text-muted-foreground">
                Creating your wallet… this usually takes a few seconds.
              </span>
            )}
            {!walletAccount && loadingAccounts ? (
              <span className="sr-only">Loading wallet address</span>
            ) : null}
          </dd>
        </div>

        <div className="space-y-1.5">
          <dt className="label-caps text-muted-foreground">Balance</dt>
          <dd className="text-sm">
            {!evmAccount ? (
              <span className="text-muted-foreground">
                Available once the wallet exists
              </span>
            ) : balanceFailed ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-destructive">Balance unavailable</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => void refetchBalance()}
                >
                  Retry
                </Button>
              </span>
            ) : loadingBalance ? (
              <span
                aria-hidden
                className="block h-6 w-24 animate-pulse rounded-sm bg-foreground/10"
              />
            ) : (
              <span className="font-mono text-base text-foreground">
                {balance?.balance ?? "0"}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="border-t border-hairline pt-4 text-sm leading-relaxed text-muted-foreground">
        Funds stay in this wallet, under your account, until you confirm a hire
        in your iMessage thread. Drafting a job costs nothing and nothing is
        charged without your explicit confirmation.
      </p>

      <DynamicLogoutButton />
    </div>
  );
}
