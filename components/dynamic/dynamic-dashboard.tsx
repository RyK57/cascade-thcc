"use client";

import { useEffect } from "react";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import {
  getActiveNetworkId,
  switchActiveNetwork,
} from "@dynamic-labs-sdk/client";
import { useGetWalletAccounts, useUser } from "@dynamic-labs-sdk/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { BASE_SEPOLIA_CHAIN_ID } from "@/libs/dynamic/sandbox";
import { DynamicLogoutButton } from "./dynamic-logout-button";
import { DynamicStatus } from "./dynamic-status";
import { WalletAddress } from "./wallet-address";

const BASE_SEPOLIA_NETWORK_ID = String(BASE_SEPOLIA_CHAIN_ID);

interface WalletBalances {
  eth: string;
  usdc: string;
}

async function fetchWalletBalances(address: string): Promise<WalletBalances> {
  const response = await fetch(
    `${ROUTES.api.agentWallet}?extra=${encodeURIComponent(address)}`
  );
  const data = (await response.json()) as {
    error?: string;
    balances?: Record<string, WalletBalances>;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Could not load balances");
  }

  const match = Object.entries(data.balances ?? {}).find(
    ([key]) => key.toLowerCase() === address.toLowerCase()
  );
  return match?.[1] ?? { eth: "0", usdc: "0" };
}

function formatEth(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toFixed(4);
}

function formatUsdc(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * The wallet, once someone is signed in. It has to answer three questions at a
 * glance — whose account is this, which address holds the money, and how much
 * is in it — and say plainly that nothing leaves without a confirmation.
 *
 * Balances come from our Base Sepolia RPC (same source as checkout), not
 * Dynamic's active-network native balance — which fails when the wallet is
 * still on the wrong chain.
 */
export function DynamicDashboard() {
  const { data: user } = useUser();
  const { data: accounts = [], isLoading: loadingAccounts } =
    useGetWalletAccounts();

  const evmAccount = accounts.find(
    (account): account is EvmWalletAccount => account.chain === "EVM"
  );
  const walletAccount = evmAccount ?? accounts[0];
  const address = walletAccount?.address;

  useEffect(() => {
    if (!evmAccount) return;

    let cancelled = false;

    void (async () => {
      try {
        const active = await getActiveNetworkId({ walletAccount: evmAccount });
        if (cancelled || active.networkId === BASE_SEPOLIA_NETWORK_ID) return;
        await switchActiveNetwork({
          walletAccount: evmAccount,
          networkId: BASE_SEPOLIA_NETWORK_ID,
        });
      } catch {
        // Checkout still switches explicitly on pay; dashboard can show RPC
        // balances even if the wallet network switch is blocked.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [evmAccount]);

  const {
    data: balances,
    isLoading: loadingBalance,
    isError: balanceFailed,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["wallet-balances", address],
    queryFn: () => fetchWalletBalances(address!),
    enabled: Boolean(address),
    refetchInterval: 10_000,
    retry: 1,
  });

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
            {!address ? (
              <span className="text-muted-foreground">
                Available once the wallet exists
              </span>
            ) : balanceFailed ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">
                  Couldn’t load balances just now
                </span>
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
                className="block h-6 w-40 animate-pulse rounded-sm bg-foreground/10"
              />
            ) : (
              <span className="font-mono text-base text-foreground">
                {formatUsdc(balances?.usdc ?? "0")} USDC
                <span className="ml-2 text-sm text-muted-foreground">
                  · {formatEth(balances?.eth ?? "0")} ETH
                </span>
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
