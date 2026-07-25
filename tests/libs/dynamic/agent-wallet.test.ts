import { afterEach, describe, expect, it } from "vitest";
import {
  getAgentWalletKeyShares,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";

const DEMO_METADATA = JSON.stringify({
  walletId: "w_1",
  accountAddress: "0x1234567890123456789012345678901234567890",
  chainName: "EVM",
  thresholdSignatureScheme: "TWO_OF_TWO",
});

const ORIGINAL = {
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
  DYNAMIC_API_TOKEN: process.env.DYNAMIC_API_TOKEN,
  DYNAMIC_API_KEY: process.env.DYNAMIC_API_KEY,
  AGENT_WALLET_METADATA: process.env.AGENT_WALLET_METADATA,
  AGENT_WALLET_KEY_SHARES: process.env.AGENT_WALLET_KEY_SHARES,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("isAgentWalletConfigured", () => {
  it("returns false when any required env is missing", () => {
    delete process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    delete process.env.DYNAMIC_API_TOKEN;
    delete process.env.DYNAMIC_API_KEY;
    delete process.env.AGENT_WALLET_METADATA;
    expect(isAgentWalletConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "env_1";
    process.env.DYNAMIC_API_TOKEN = "tok_1";
    expect(isAgentWalletConfigured()).toBe(false);
  });

  it("returns false when metadata is invalid JSON", () => {
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "env_1";
    process.env.DYNAMIC_API_TOKEN = "tok_1";
    process.env.AGENT_WALLET_METADATA = "not json";
    expect(isAgentWalletConfigured()).toBe(false);
  });

  it("returns true when environment, token, and metadata are set", () => {
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "env_1";
    process.env.DYNAMIC_API_TOKEN = "tok_1";
    process.env.AGENT_WALLET_METADATA = DEMO_METADATA;
    expect(isAgentWalletConfigured()).toBe(true);
  });

  it("accepts DYNAMIC_API_KEY as an alias for DYNAMIC_API_TOKEN", () => {
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "env_1";
    delete process.env.DYNAMIC_API_TOKEN;
    process.env.DYNAMIC_API_KEY = "dyn_1";
    process.env.AGENT_WALLET_METADATA = DEMO_METADATA;
    expect(isAgentWalletConfigured()).toBe(true);
  });
});

describe("getAgentWalletKeyShares", () => {
  it("returns undefined when unset or invalid", () => {
    delete process.env.AGENT_WALLET_KEY_SHARES;
    expect(getAgentWalletKeyShares()).toBeUndefined();
    process.env.AGENT_WALLET_KEY_SHARES = "not-json";
    expect(getAgentWalletKeyShares()).toBeUndefined();
    process.env.AGENT_WALLET_KEY_SHARES = '{"not":"an-array"}';
    expect(getAgentWalletKeyShares()).toBeUndefined();
  });

  it("parses an array of shares from env", () => {
    process.env.AGENT_WALLET_KEY_SHARES = '[{"id":1}]';
    expect(getAgentWalletKeyShares()).toEqual([{ id: 1 }]);
  });
});
