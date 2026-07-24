"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="font-secondary text-3xl">Something went wrong</h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. Try again or return home.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href={ROUTES.home}>Go home</a>
        </Button>
      </div>
    </div>
  );
}
