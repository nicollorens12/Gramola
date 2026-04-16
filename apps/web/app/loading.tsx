export default function Loading() {
  return (
    <div className="flex flex-col gap-4 py-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-ink-faint/50 bg-canvas-1"
        />
      ))}
    </div>
  );
}
