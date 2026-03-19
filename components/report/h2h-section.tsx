'use client'

interface H2HMatch {
  date: string
  homeTeam: string
  score: string
  awayTeam: string
}

interface H2HSectionProps {
  homeTeam: string
  awayTeam: string
  homeWins: number
  awayWins: number
  draws: number
  matches: H2HMatch[]
}

export function H2HSection({ homeTeam, awayTeam, homeWins, awayWins, draws, matches }: H2HSectionProps) {
  const total = homeWins + awayWins + draws || 1
  const homePct = (homeWins / total) * 100
  const drawPct = (draws / total) * 100

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">ИСТОРИЯ ВСТРЕЧ (H2H)</h3>

      {/* Score summary */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="text-sm font-medium text-text">{homeTeam}</span>
        <span className="font-display text-2xl text-text tabular-nums">
          {homeWins} <span className="text-muted text-lg">:</span> {awayWins}
        </span>
        <span className="text-sm font-medium text-text">{awayTeam}</span>
      </div>

      {/* Proportional bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-5">
        <div className="bg-accent transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="bg-border-secondary transition-all duration-500" style={{ width: `${drawPct}%` }} />
        <div className="bg-bg-inner flex-1" />
      </div>

      {/* Recent matches */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          {matches.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-text-secondary">
              <span className="text-muted w-20">{m.date}</span>
              <span className="flex-1 text-center">
                <span className="text-text">{m.homeTeam}</span>
                {' '}
                <span className="font-medium text-text tabular-nums">{m.score}</span>
                {' '}
                <span className="text-text">{m.awayTeam}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
