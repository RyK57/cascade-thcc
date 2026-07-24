import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">404</p>
        <h1 className="font-secondary text-3xl">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          The page you are looking for does not exist or was moved.
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.home}>Back to home</Link>
      </Button>
    </div>
  );
}
