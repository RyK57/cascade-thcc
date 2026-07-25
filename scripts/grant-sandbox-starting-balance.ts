/**
 * One-shot: grant every existing Cascade user the $100 sandbox stipend.
 *
 * Usage: node --import tsx scripts/grant-sandbox-starting-balance.ts
 *
 * Safe to re-run — ensureSandboxStartingBalance is idempotent (ledger marker).
 */
import { resolve } from "node:path";
import { createAdminClient, isSupabaseAdminConfigured } from "../utils/supabase/admin";
import { USER_ROW_COLUMNS, mapUserRow, type UserRow } from "../db/users/map-row";
import { ensureSandboxStartingBalance } from "../libs/dynamic/sandbox-starting-balance";
import { SANDBOX_STARTING_CREDITS } from "../libs/dynamic/sandbox";

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
    // optional
  }
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  if (!isSupabaseAdminConfigured()) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY (and URL) before granting.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_ROW_COLUMNS)
    .returns<UserRow[]>();

  if (error) throw new Error(error.message);

  const users = (data ?? []).map(mapUserRow);
  let granted = 0;
  let skipped = 0;

  for (const user of users) {
    const before = user.creditBalance;
    const after = await ensureSandboxStartingBalance(user);
    if (after.creditBalance !== before) {
      granted += 1;
      console.log(
        `+ ${user.phone ?? user.email ?? user.id}: ${before} → ${after.creditBalance}`
      );
    } else {
      skipped += 1;
    }
  }

  console.log(
    `\nDone. stipend=${SANDBOX_STARTING_CREDITS} topped_up=${granted} unchanged=${skipped} total=${users.length}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
