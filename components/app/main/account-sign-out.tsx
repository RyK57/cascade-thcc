import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { endAccountSession } from "@/libs/account";
import { ROUTES } from "@/lib/constants/routes";

async function signOutOfAccount() {
  "use server";
  await endAccountSession();
  redirect(ROUTES.home);
}

/** Sign out of a phone-verified session (distinct from the operator login). */
export function AccountSignOut() {
  return (
    <form action={signOutOfAccount} className="shrink-0">
      <Button
        variant="outline"
        size="sm"
        type="submit"
        className="w-full md:w-auto"
      >
        Sign out
      </Button>
    </form>
  );
}
