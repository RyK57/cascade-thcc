import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Cascade mobile shells (iOS + Android) wrap the deployed web app.
 * Set CAP_SERVER_URL to the deployed Vercel URL for release builds;
 * defaults to the production site, falls back to localhost for simulators
 * via `CAP_SERVER_URL=http://localhost:3000 npx cap sync`.
 */
const serverUrl =
  process.env.CAP_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.cascade.app",
  appName: "Cascade",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
