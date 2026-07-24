import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Internal
            </p>
            <h1 className="font-secondary text-xl">Tooling</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.main}>Back to app</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
