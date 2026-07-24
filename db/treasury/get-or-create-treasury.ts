import { createAdminClient } from "@/utils/supabase/admin";
import { BASE_SEPOLIA_CHAIN_ID } from "@/libs/dynamic/sandbox";

export interface TreasuryWallet {
  id: string;
  address: string;
  chainId: number;
  walletMetadata?: Record<string, unknown>;
}

export async function getTreasuryWallet(): Promise<TreasuryWallet | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("treasury_wallets")
    .select("id, address, chain_id, wallet_metadata")
    .eq("chain_id", BASE_SEPOLIA_CHAIN_ID)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    address: data.address,
    chainId: data.chain_id,
    walletMetadata: (data.wallet_metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function upsertTreasuryWallet(params: {
  address: string;
  walletMetadata?: Record<string, unknown>;
}): Promise<TreasuryWallet> {
  const existing = await getTreasuryWallet();
  const supabase = createAdminClient();

  if (existing) {
    const { data, error } = await supabase
      .from("treasury_wallets")
      .update({
        address: params.address,
        wallet_metadata: params.walletMetadata ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, address, chain_id, wallet_metadata")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update treasury wallet");
    }

    return {
      id: data.id,
      address: data.address,
      chainId: data.chain_id,
      walletMetadata:
        (data.wallet_metadata as Record<string, unknown>) ?? undefined,
    };
  }

  const { data, error } = await supabase
    .from("treasury_wallets")
    .insert({
      address: params.address,
      chain_id: BASE_SEPOLIA_CHAIN_ID,
      wallet_metadata: params.walletMetadata ?? null,
    })
    .select("id, address, chain_id, wallet_metadata")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create treasury wallet");
  }

  return {
    id: data.id,
    address: data.address,
    chainId: data.chain_id,
    walletMetadata: (data.wallet_metadata as Record<string, unknown>) ?? undefined,
  };
}
