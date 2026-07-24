"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusPage } from "@/components/app/status-page";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants/branding";
import { ROUTES } from "@/lib/constants/routes";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
    // An error boundary has to be a client component, so it can't export
    // `metadata`. Set the title here rather than inherit the previous page's.
    document.title = `Something went wrong · ${BRAND.name}`;
  }, [error]);

  return (
    <StatusPage
      marker="Error"
      title="Something went wrong on our side"
      description="This page failed to load. Nothing you were doing was sent or charged. Retrying usually clears it — if it doesn’t, your workspace and your iMessage thread are both unaffected."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.main}>Go to your workspace</Link>
          </Button>
        </>
      }
      footnote={
        error.digest ? (
          <p>
            Quote this reference if you report it:{" "}
            <code className="font-mono text-foreground">{error.digest}</code>
          </p>
        ) : null
      }
    />
  );
}
