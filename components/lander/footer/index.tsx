import { BRAND } from "@/lib/constants/branding";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} {BRAND.name}</p>
        <p className="font-secondary text-sm text-muted-foreground">Built for rapid prototyping</p>
      </div>
    </footer>
  );
}
