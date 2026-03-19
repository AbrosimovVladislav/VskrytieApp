'use client'

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-bg-inner rounded animate-pulse ${className ?? ''}`} />
}

export function HeaderSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-3 w-32 mb-4" />
      <div className="flex items-center justify-between gap-3">
        <Pulse className="h-6 w-24 flex-1" />
        <Pulse className="h-4 w-6" />
        <Pulse className="h-6 w-24 flex-1" />
      </div>
      <Pulse className="h-3 w-40 mt-4 mx-auto" />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-36 mb-4" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Pulse className="h-4 w-20" />
          <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Pulse key={i} className="w-3 h-3 rounded-full" />)}</div>
          <Pulse className="h-3 w-12 ml-auto" />
        </div>
        <div className="flex items-center gap-3">
          <Pulse className="h-4 w-20" />
          <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Pulse key={i} className="w-3 h-3 rounded-full" />)}</div>
          <Pulse className="h-3 w-12 ml-auto" />
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-44 mb-4" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Pulse className="h-3 w-40" />
            <Pulse className="h-2 w-full rounded-full" />
            <Pulse className="h-2 w-3/4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InjuriesSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-44 mb-4" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-3 w-32" />
        </div>
        <Pulse className="h-14 w-full rounded-[--radius-button]" />
        <Pulse className="h-14 w-full rounded-[--radius-button]" />
      </div>
    </div>
  )
}

export function H2HSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-40 mb-4" />
      <div className="flex items-center justify-center gap-4 mb-3">
        <Pulse className="h-4 w-16" />
        <Pulse className="h-8 w-16" />
        <Pulse className="h-4 w-16" />
      </div>
      <Pulse className="h-2 w-full rounded-full mb-5" />
      <div className="flex flex-col gap-2">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-full" />
      </div>
    </div>
  )
}

export function OddsSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-32 mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Pulse key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}

export function RecommendationSkeleton() {
  return (
    <div className="rounded-[--radius-card] bg-bg-card-dark border border-border-card p-5 shadow-[--shadow-card]">
      <Pulse className="h-4 w-44 mb-3" />
      <div className="flex flex-col gap-2">
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-2/3" />
      </div>
    </div>
  )
}
