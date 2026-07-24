"use client";

import { useLogout } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";

export function DynamicLogoutButton() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={() => logout()}>
      {isPending ? "Logging out…" : "Log out"}
    </Button>
  );
}
