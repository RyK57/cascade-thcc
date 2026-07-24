import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dynamic-labs-sdk/client",
    "@dynamic-labs-sdk/evm",
    "@dynamic-labs-sdk/react-hooks",
  ],
  // Native/wasm server-wallet SDK: resolve at runtime, never bundle.
  serverExternalPackages: [
    "@dynamic-labs-wallet/node-evm",
    "@dynamic-labs-wallet/node",
  ],
};

export default nextConfig;
