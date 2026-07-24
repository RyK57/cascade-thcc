import { NextResponse } from "next/server";
import { endAccountSession, getAccountIdentity } from "@/libs/account";

export const runtime = "nodejs";

/** Who the browser is, as proven by phone. Never exposes the session token. */
export async function GET() {
  const identity = await getAccountIdentity().catch(() => null);
  if (!identity) {
    return NextResponse.json({ signedIn: false });
  }

  return NextResponse.json({
    signedIn: true,
    phone: identity.session.phone,
    walletAddress: identity.user?.walletAddress ?? null,
    creditBalance: identity.user?.creditBalance ?? 0,
  });
}

export async function DELETE() {
  await endAccountSession();
  return NextResponse.json({ ok: true });
}
