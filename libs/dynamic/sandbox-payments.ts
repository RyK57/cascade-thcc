/**
 * Demo-safe payment mode. Dynamic's EVM Gas Sponsorship is currently broken
 * for this environment, and the agent wallet has no Base Sepolia ETH, so
 * on-chain USDC transfers fail with `gas required exceeds allowance (0)`.
 *
 * Default: simulate fund + payout hashes (`0xsim…`). Opt into real chain with
 * `DYNAMIC_REAL_CHAIN_PAYMENTS=1` once sponsorship / gas tank works again.
 */
export function shouldSimulateSandboxPayments(): boolean {
  return process.env.DYNAMIC_REAL_CHAIN_PAYMENTS?.trim() !== "1";
}

export function simulatedSandboxTxHash(): string {
  return `0xsim${crypto.randomUUID().replace(/-/g, "")}`;
}
