import { Layers, MessageSquare, Users, Wallet } from "lucide-react";

export interface FeatureItem {
  title: string;
  description: string;
  icon: "layers" | "message" | "users" | "wallet";
}

export const FEATURES: FeatureItem[] = [
  {
    title: "Linq messaging",
    description:
      "Server-side iMessage/SMS via @linqapp/sdk — POST /api/linq/chats to start a chat.",
    icon: "message",
  },
  {
    title: "Terac humans",
    description:
      "Recruit verified experts through Terac’s REST API — list and manage opportunities in-app.",
    icon: "users",
  },
  {
    title: "Dynamic wallets",
    description:
      "Wallet login with Dynamic’s React SDK and DynamicWidget, gated by environment ID.",
    icon: "wallet",
  },
  {
    title: "Prototype-ready",
    description:
      "Built from prototype-template: lander, auth scaffold, Supabase optional, Vitest included.",
    icon: "layers",
  },
] as const;

export const FEATURE_ICONS = {
  layers: Layers,
  message: MessageSquare,
  users: Users,
  wallet: Wallet,
} as const;
