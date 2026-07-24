"use client";

import { useLogout } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";

export function DynamicLogoutButton() {
  const { mutate: logout, error, isPending } = useLogout();

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => logout()}
      >
        {isPending ? "Signing out…" : "Sign out of wallet"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn’t sign out — {error.message}. Your session is still active; try
          again or reload the page.
        </p>
      ) : null}
    </div>
  );
}
