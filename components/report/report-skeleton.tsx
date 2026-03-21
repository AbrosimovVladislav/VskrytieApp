"use client";

export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-in fade-in duration-150">
      {/* Header skeleton */}
      <div className="bg-bg-card rounded-[--radius-card] border border-border p-5 flex flex-col items-center gap-3">
        <div className="bg-bg-card-dark animate-pulse h-3 w-16 rounded" />
        <div className="flex items-center gap-3">
          <div className="bg-bg-card-dark animate-pulse h-6 w-20 rounded" />
          <div className="bg-bg-card-dark animate-pulse h-3 w-6 rounded" />
          <div className="bg-bg-card-dark animate-pulse h-6 w-20 rounded" />
        </div>
        <div className="bg-bg-card-dark animate-pulse h-3 w-40 rounded" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SectionSkeleton key={i} lines={i % 2 === 0 ? 4 : 3} />
      ))}
    </div>
  );
}

function SectionSkeleton({ lines }: { lines: number }) {
  return (
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-4">
      <div className="bg-bg-card-dark animate-pulse h-4 w-28 rounded mb-3" />
      <div className="flex flex-col gap-2 mb-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="bg-bg-card-dark animate-pulse h-3 rounded"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>
      <div className="border-t border-border pt-3">
        <div className="bg-bg-card-dark animate-pulse h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}
