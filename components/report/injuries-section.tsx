'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface PlayerAbsence {
  name: string
  position: string
  reason: 'травма' | 'дисквалификация' | 'сомнение'
  duration?: string
}

interface InjuriesSectionProps {
  homeTeam: string
  awayTeam: string
  homeOk: boolean
  awayOk: boolean
  home: PlayerAbsence[]
  away: PlayerAbsence[]
}

const reasonIcon: Record<string, string> = {
  'травма': '🏥',
  'дисквалификация': '🟥',
  'сомнение': '❓',
}

function TeamInjuries({ team, ok, players }: { team: string; ok: boolean; players: PlayerAbsence[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text">{team}</span>
        {ok ? (
          <span className="flex items-center gap-1 text-xs text-positive">
            <CheckCircle2 size={12} />
            Состав в порядке
          </span>
        ) : (
          <span className="text-xs text-muted">{players.length} ключевых</span>
        )}
      </div>
      {players.map((p, i) => (
        <div key={i} className="rounded-[--radius-button] bg-bg-overlay border border-border px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0">{reasonIcon[p.reason] ?? '⚠'}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text">{p.name}</span>
            <span className="text-xs text-muted">
              {p.position}{p.duration ? ` · ${p.duration}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function InjuriesSection({ homeTeam, awayTeam, homeOk, awayOk, home, away }: InjuriesSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">ТРАВМЫ И ОТСУТСТВИЯ</h3>
      <div className="flex flex-col gap-4">
        <TeamInjuries team={homeTeam} ok={homeOk} players={home} />
        <TeamInjuries team={awayTeam} ok={awayOk} players={away} />
      </div>
    </div>
  )
}
