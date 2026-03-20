'use client'

import type { TeamStats } from '@/lib/types/report'

interface StatsSectionProps {
  home: TeamStats
  away: TeamStats
  homeTeam: string
  awayTeam: string
  analysis?: string
}

function XgBlock({ team, goals, xG }: { team: string; goals: number; xG?: number | null }) {
  if (xG == null) return null

  const diff = goals - xG
  let indicator: string
  let colorClass: string

  if (diff > 0.15) {
    indicator = `▲ Забивают больше xG (+${diff.toFixed(2)})`
    colorClass = 'text-warning'
  } else if (diff < -0.15) {
    indicator = `▼ Забивают меньше xG (${diff.toFixed(2)})`
    colorClass = 'text-positive'
  } else {
    indicator = '≈ В рамках ожиданий'
    colorClass = 'text-muted'
  }

  return (
    <div className="rounded-[--radius-button] bg-bg-overlay border border-border px-3 py-2.5">
      <p className="text-xs font-medium text-text mb-1">{team}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-sm tabular-nums text-text">
          Голы <span className="font-semibold">{goals.toFixed(1)}</span> vs xG <span className="font-semibold">{xG.toFixed(2)}</span>
        </span>
      </div>
      <p className={`text-xs mt-1 ${colorClass}`}>{indicator}</p>
    </div>
  )
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
  const allBars: BarProps[] = [
    { label: 'Голов забито (ср.)', homeValue: home.goalsScored, awayValue: away.goalsScored },
    { label: 'Голов пропущено (ср.)', homeValue: home.goalsConceded, awayValue: away.goalsConceded, invertAccent: true },
    { label: 'Удары в створ (ср.)', homeValue: home.shotsOnTarget, awayValue: away.shotsOnTarget },
    { label: 'Владение %', homeValue: home.possession, awayValue: away.possession },
    { label: 'BTTS %', homeValue: home.bttsPct, awayValue: away.bttsPct },
    { label: 'Тотал Б2.5 %', homeValue: home.over25Pct, awayValue: away.over25Pct },
  ]
  // Hide bars where both values are 0 (e.g. hockey has no shots/possession data)
  const bars = allBars.filter(b => b.homeValue > 0 || b.awayValue > 0)

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">ПРОДВИНУТАЯ СТАТИСТИКА</h3>

      {/* xG Performance Block */}
      {(home.xG != null || away.xG != null) && (
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">xG-перформанс</p>
          <XgBlock team={homeTeam} goals={home.goalsScored} xG={home.xG} />
          <XgBlock team={awayTeam} goals={away.goalsScored} xG={away.xG} />
        </div>
      )}

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

      {/* Analysis text */}
      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
