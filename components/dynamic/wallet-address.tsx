"use client";

import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { explorerAddressUrl } from "@/libs/dynamic/sandbox";

interface WalletAddressProps {
  address: string;
  /** Accessible name for the copy control. */
  label?: string;
  /** Link out to the block explorer. Off for placeholder/simulated addresses. */
  explorer?: boolean;
}

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * A 42-character hex string is data, not prose: monospace, truncated in the
 * middle so both ends stay checkable, full value on hover, one click to copy.
 */
export function WalletAddress({
  address,
  label = "Copy wallet address",
  explorer = false,
}: WalletAddressProps) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1">
      <code
        title={address}
        className="rounded-sm bg-foreground/5 px-2 py-1 font-mono text-xs text-foreground"
      >
        {truncate(address)}
        <span className="sr-only">{` (full address ${address})`}</span>
      </code>
      <CopyButton value={address} label={label} />
      {explorer ? (
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-sm text-xs text-accent-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Explorer
          <ExternalLink aria-hidden className="size-3" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </span>
  );
}
