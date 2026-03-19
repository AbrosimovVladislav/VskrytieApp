'use client'

interface HeaderProps {
  league: string
  date: string
  homeTeam: string
  awayTeam: string
  stadium?: string
  time?: string
}

export function HeaderSection({ league, date, homeTeam, awayTeam, stadium, time }: HeaderProps) {
  const meta = [stadium, time].filter(Boolean).join(' · ')

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <p className="text-xs uppercase tracking-wider text-muted mb-4">
        {league} · {date}
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xl font-medium text-text text-center flex-1 min-w-0 break-words">{homeTeam}</span>
        <span className="text-sm font-medium text-muted shrink-0">VS</span>
        <span className="text-xl font-medium text-text text-center flex-1 min-w-0 break-words">{awayTeam}</span>
      </div>

      {meta && (
        <p className="text-xs text-muted mt-4 text-center">{meta}</p>
      )}
    </div>
  )
}
