/**
 * Whether a sponsored-transaction failure means sponsorship isn't available,
 * as opposed to an ambiguous network failure. Fails closed: anything that
 * could have broadcast is not retried as a self-funded tx.
 */
export function isSponsorshipUnavailable(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();

  // Ambiguous: the transaction may already be on-chain.
  if (
    /timeout|timed out|etimedout|econnreset|econnrefused|socket|aborted|network error|fetch failed|already known|nonce too low/.test(
      message
    )
  ) {
    return false;
  }

  return /sponsor|gasless|paymaster|not enabled|not supported|unsupported|disabled|forbidden|unauthorized|payment required|quota|insufficient (sponsor|gas) (credit|balance)/.test(
    message
  );
}
