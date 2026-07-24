#!/usr/bin/env tsx
import { resolve } from "node:path";
import { getDemoCredentials } from "../libs/seed/demo-credentials";
import { seedCascadePeers } from "../libs/seed/seed-cascade-peers";
import { seedDemoAccount } from "../libs/seed/seed-demo-account";
import { isSupabaseAdminConfigured } from "../utils/supabase/admin";

async function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  try {
    const { readFile } = await import("node:fs/promises");
    const contents = await readFile(path, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional env file
  }
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  if (!isSupabaseAdminConfigured()) {
    console.error(
      "Cannot seed. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  const credentials = getDemoCredentials();
  const demo = await seedDemoAccount();
  const peers = await seedCascadePeers();

  console.log("Demo account ready");
  console.log(`- email: ${credentials.email}`);
  console.log(`- password: ${credentials.password}`);
  console.log(`- userId: ${demo.userId}`);
  console.log(`- auth user created: ${demo.created ? "yes" : "no (updated)"}`);
  console.log("Cascade peers ready (must already text the Linq number):");
  for (const phone of peers.phones) {
    console.log(`- ${phone}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
