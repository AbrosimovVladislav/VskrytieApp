'use client'

import { CheckCircle2 } from 'lucide-react'
import type { Absence } from '@/lib/types/report'

interface InjuriesSectionProps {
  homeTeam: string
  awayTeam: string
  home: Absence[]
  away: Absence[]
  analysis?: string
}

const impactIcon: Record<Absence['impact'], string> = {
  key: '🔴',
  rotation: '🟡',
  minor: '⚪',
}

const reasonLabel: Record<Absence['reason'], string> = {
  injury: 'Травма',
  suspension: 'Дисквалификация',
  personal: 'Личные причины',
}

function TeamInjuries({ team, players }: { team: string; players: Absence[] }) {
  const ok = players.length === 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text">{team}</span>
        {ok ? (
          <span className="flex items-center gap-1 text-xs text-positive">
            <CheckCircle2 size={12} />
            Все в строю
          </span>
        ) : (
          <span className="text-xs text-muted">{players.length} потерь</span>
        )}
      </div>
      {players.map((p, i) => (
        <div key={i} className="rounded-[--radius-button] bg-bg-overlay border border-border px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0">{impactIcon[p.impact]}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text">{p.name}</span>
            <span className="text-xs text-muted">
              {p.role} · {reasonLabel[p.reason]}{p.details ? ` · ${p.details}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function InjuriesSection({ homeTeam, awayTeam, home, away, analysis }: InjuriesSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">КАДРОВАЯ СИТУАЦИЯ</h3>
      <div className="flex flex-col gap-4">
        <TeamInjuries team={homeTeam} players={home} />
        <TeamInjuries team={awayTeam} players={away} />
      </div>
      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
