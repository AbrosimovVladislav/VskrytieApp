'use client'

import type { TeamStats } from '@/lib/types/report'

interface StatsSectionProps {
  home: TeamStats
  away: TeamStats
  homeTeam: string
  awayTeam: string
  analysis?: string
}

interface BarProps {
  label: string
  homeValue: number
  awayValue: number
  invertAccent?: boolean // true = lower is better (e.g. goals conceded)
}

function StatBar({ label, homeValue, awayValue, invertAccent }: BarProps) {
  const max = Math.max(homeValue, awayValue, 0.01)
  const homeWidth = (homeValue / max) * 100
  const awayWidth = (awayValue / max) * 100

  const homeLeads = invertAccent ? homeValue <= awayValue : homeValue >= awayValue

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">{label}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-bg-inner overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${homeLeads ? 'bg-accent' : 'bg-bg-inner'}`}
              style={{ width: `${homeWidth}%` }}
            />
          </div>
          <span className="text-sm font-medium text-text tabular-nums w-10 text-right">{homeValue}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-bg-inner overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${!homeLeads ? 'bg-accent' : 'bg-bg-inner'}`}
              style={{ width: `${awayWidth}%` }}
            />
          </div>
          <span className="text-sm font-medium text-text tabular-nums w-10 text-right">{awayValue}</span>
        </div>
      </div>
    </div>
  )
}

export function StatsSection({ home, away, homeTeam, awayTeam, analysis }: StatsSectionProps) {
  // Build bars dynamically — only show stats where both values are non-null
  const allBars: (BarProps | null)[] = [
    home.goalsScored != null && away.goalsScored != null
      ? { label: 'Голов забито (ср.)', homeValue: home.goalsScored, awayValue: away.goalsScored }
      : null,
    home.goalsConceded != null && away.goalsConceded != null
      ? { label: 'Голов пропущено (ср.)', homeValue: home.goalsConceded, awayValue: away.goalsConceded, invertAccent: true }
      : null,
    home.shotsOnTarget != null && away.shotsOnTarget != null
      ? { label: 'Удары в створ (ср.)', homeValue: home.shotsOnTarget, awayValue: away.shotsOnTarget }
      : null,
    home.possession != null && away.possession != null
      ? { label: 'Владение %', homeValue: home.possession, awayValue: away.possession }
      : null,
  ]

  const bars = allBars.filter((b): b is BarProps => b != null)

  if (bars.length === 0 && !analysis) return null

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">СТАТИСТИКА</h3>

      {bars.length > 0 && (
        <>
          {/* Team labels */}
          <div className="flex justify-between mb-3">
            <span className="text-xs text-muted">{homeTeam}</span>
            <span className="text-xs text-muted">{awayTeam}</span>
          </div>

          <div className="flex flex-col gap-4">
            {bars.map((bar, i) => (
              <StatBar key={i} {...bar} />
            ))}
          </div>
        </>
      )}

      {/* Analysis text */}
      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
