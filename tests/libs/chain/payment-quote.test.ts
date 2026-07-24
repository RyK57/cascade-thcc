import { beforeEach, describe, expect, it, vi } from "vitest";

const getGasPrice = vi.fn();

vi.mock("@/libs/chain/public-client", () => ({
  getPublicClient: () => ({ getGasPrice }),
}));

import { buildPaymentQuote, quoteLine } from "@/libs/chain/payment-quote";
import { __resetEthPriceCache } from "@/libs/chain/eth-price";

const ETH_USD = 2500;

beforeEach(() => {
  __resetEthPriceCache();
  // 0.05 gwei — a realistic Base L2 gas price.
  getGasPrice.mockReset().mockResolvedValue(50_000_000n);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { amount: String(ETH_USD) } }),
    }))
  );
});

describe("buildPaymentQuote — stablecoin", () => {
  it("quotes 1:1 with USD and adds a network fee", async () => {
    const quote = await buildPaymentQuote({ amountCents: 1200, asset: "usdc" });

    expect(quote.amountLabel).toBe("12 USDC");
    expect(quote.usdLabel).toBe("$12.00");
    expect(quote.feeLabel).toBe("~<$0.01");
    expect(quote.rateLabel).toBeNull();
  });
});

describe("buildPaymentQuote — ETH", () => {
  it("converts the USD price into ETH and shows the rate used", async () => {
    const quote = await buildPaymentQuote({ amountCents: 18_000, asset: "eth" });

    // $180 at $2,500/ETH = 0.072 ETH.
    expect(quote.amountLabel).toBe("0.072 ETH");
    expect(quote.usdLabel).toBe("$180.00");
    expect(quote.rateLabel).toBe("1 ETH ≈ $2,500.00");
  });

  it("renders one line with the amount, its USD value, the rate, and gas", async () => {
    const line = quoteLine(
      await buildPaymentQuote({ amountCents: 18_000, asset: "eth" })
    );

    expect(line).toContain("0.072 ETH");
    expect(line).toContain("≈ $180.00");
    expect(line).toContain("1 ETH ≈ $2,500.00");
    expect(line).toContain("network fee");
  });

  it("never renders a tiny amount as zero", async () => {
    // Contrived rate so one cent falls below ETH display precision.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: { amount: "20000000" } }),
      }))
    );
    __resetEthPriceCache();

    const quote = await buildPaymentQuote({ amountCents: 1, asset: "eth" });
    expect(quote.amountLabel).toBe("<0.000001 ETH");
  });

  it("omits the ETH amount rather than inventing a rate when spot is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    __resetEthPriceCache();

    const quote = await buildPaymentQuote({ amountCents: 18_000, asset: "eth" });

    expect(quote.rateLabel).toBeNull();
    expect(quote.feeLabel).toBeNull();
    expect(quote.amountLabel).toBe("$180.00");
  });

  it("still quotes when the gas estimate fails", async () => {
    getGasPrice.mockRejectedValue(new Error("rpc down"));

    const quote = await buildPaymentQuote({ amountCents: 18_000, asset: "eth" });

    expect(quote.amountLabel).toBe("0.072 ETH");
    expect(quote.feeLabel).toBeNull();
    expect(quote.totalLabel).toBeNull();
  });
});
