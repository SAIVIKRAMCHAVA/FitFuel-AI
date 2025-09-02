export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 bg-muted/50 rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <div className="h-4 w-24 bg-muted/50 rounded" />
            <div className="h-8 w-16 bg-muted/50 rounded" />
            <div className="h-3 w-full bg-muted/50 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border h-28 bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
