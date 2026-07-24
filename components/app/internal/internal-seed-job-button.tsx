"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";

interface SeedJobResponse {
  ok?: boolean;
  payUrl?: string;
  error?: string;
}

/** Seed a checkout-ready demo job and surface its pay link (demo entry point). */
export function InternalSeedJobButton() {
  const [pending, setPending] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function seed() {
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch(ROUTES.api.internalSeedDemoJob, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as SeedJobResponse;
      if (!response.ok || !data.payUrl) {
        throw new Error(data.error ?? "Seed failed");
      }
      setPayUrl(data.payUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo job seed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Creates a job in payment_pending with a $3.00 payment row.</p>
        <Button onClick={seed} disabled={pending} size="sm">
          {pending ? "Seeding…" : "Seed demo job"}
        </Button>
        {payUrl ? (
          <div className="space-y-2">
            <a
              href={payUrl}
              className="block break-all text-foreground underline underline-offset-2"
            >
              {payUrl}
            </a>
            <Button onClick={copy} size="sm" variant="outline">
              {copied ? "Copied" : "Copy pay link"}
            </Button>
          </div>
        ) : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
