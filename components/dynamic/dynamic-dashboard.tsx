"use client";

import {
  useGetWalletAccounts,
  useInitStatus,
  useUser,
} from "@dynamic-labs-sdk/react-hooks";
import { DynamicLogoutButton } from "./dynamic-logout-button";

export function DynamicDashboard() {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const { data: accounts = [] } = useGetWalletAccounts();

  if (initStatus !== "finished") {
    return <p className="text-sm text-muted-foreground">Loading Dynamic…</p>;
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Not signed in</p>;
  }

  const address = accounts[0]?.address;

  return (
    <div className="space-y-3">
      <div className="space-y-1 text-sm">
        <p>
          Signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <p className="text-muted-foreground">
          Wallet:{" "}
          <code className="text-foreground">{address ?? "creating…"}</code>
        </p>
      </div>
      <DynamicLogoutButton />
    </div>
  );
}
