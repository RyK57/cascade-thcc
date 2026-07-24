export default function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading…
      </div>
    </div>
  );
}
