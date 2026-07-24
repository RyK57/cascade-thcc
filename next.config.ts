import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dynamic-labs-sdk/client",
    "@dynamic-labs-sdk/evm",
    "@dynamic-labs-sdk/react-hooks",
  ],
};

export default nextConfig;
