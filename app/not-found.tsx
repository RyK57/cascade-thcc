import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/app/status-page";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <StatusPage
      marker="404"
      title="There’s nothing at this address"
      description="The page you asked for doesn’t exist, or it moved. If you followed a link from an iMessage thread, the job it pointed at may already be settled."
      actions={
        <>
          <Button asChild>
            <Link href={ROUTES.main}>Go to your workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.home}>Back to home</Link>
          </Button>
        </>
      }
    />
  );
}
