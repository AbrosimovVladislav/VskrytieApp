'use client'

interface StatItem {
  label: string
  homeValue: number
  awayValue: number
  unit?: string
}

interface StatsSectionProps {
  stats: StatItem[]
  homeTeam: string
  awayTeam: string
}

function StatBar({ label, homeValue, awayValue }: StatItem) {
  const max = Math.max(homeValue, awayValue, 1)
  const homeWidth = (homeValue / max) * 100
  const awayWidth = (awayValue / max) * 100
  const homeLeads = homeValue >= awayValue

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
          <span className="text-sm font-medium text-text tabular-nums w-8 text-right">{homeValue}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-bg-inner overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${!homeLeads ? 'bg-accent' : 'bg-bg-inner'}`}
              style={{ width: `${awayWidth}%` }}
            />
          </div>
          <span className="text-sm font-medium text-text tabular-nums w-8 text-right">{awayValue}</span>
        </div>
      </div>
    </div>
  )
}

export function StatsSection({ stats, homeTeam, awayTeam }: StatsSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ</h3>

      {/* Team labels */}
      <div className="flex justify-between mb-3">
        <span className="text-xs text-muted">{homeTeam}</span>
        <span className="text-xs text-muted">{awayTeam}</span>
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((stat, i) => (
          <StatBar key={i} {...stat} />
        ))}
      </div>
    </div>
  )
}
