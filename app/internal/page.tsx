import type { Metadata } from "next";
import { InternalToolingDashboard } from "@/components/app/internal";

export const metadata: Metadata = {
  title: "Internal tooling",
};

export default function InternalPage() {
  return <InternalToolingDashboard />;
}
