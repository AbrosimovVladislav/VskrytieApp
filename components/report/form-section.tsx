'use client'

import type { TeamForm, H2HGame, FormResult } from '@/lib/types/report'

interface FormSectionProps {
  homeTeam: string
  awayTeam: string
  form: { home: TeamForm; away: TeamForm }
  h2h: { homeWins: number; awayWins: number; draws: number; recentGames: H2HGame[] }
  analysis?: string
}

const dotColor: Record<FormResult, string> = {
  W: 'bg-positive',
  D: 'bg-border-secondary',
  L: 'bg-negative',
}

function countRecord(results: FormResult[]) {
  const w = results.filter(r => r === 'W').length
  const l = results.filter(r => r === 'L').length
  return `${w}В ${l}П`
}

function FormRow({ team, results, streak }: { team: string; results: FormResult[]; streak?: string }) {
  if (!results.length) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text w-28 shrink-0 leading-tight">{team}</span>
        <span className="text-xs text-muted">нет данных</span>
        <div className="w-20" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-text w-28 shrink-0 leading-tight">{team}</span>
      <div className="flex items-center gap-1">
        {results.map((r, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${dotColor[r]}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 w-20 justify-end">
        <span className="text-xs text-text-secondary tabular-nums">{countRecord(results)}</span>
        {streak && <span className="text-[10px] text-muted bg-bg-inner px-1.5 py-0.5 rounded">{streak}</span>}
      </div>
    </div>
  )
}

export function FormSection({ homeTeam, awayTeam, form, h2h, analysis }: FormSectionProps) {
  const total = h2h.homeWins + h2h.awayWins + h2h.draws || 1
  const homePct = (h2h.homeWins / total) * 100
  const drawPct = (h2h.draws / total) * 100

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">ФОРМА И РЕЗУЛЬТАТЫ</h3>

      {/* Last 5 */}
      <div className="flex flex-col gap-3 mb-4">
        <FormRow team={homeTeam} results={form.home.last5} streak={form.home.streak} />
        <FormRow team={awayTeam} results={form.away.last5} streak={form.away.streak} />
      </div>

      {/* Home/Away specific records */}
      {(form.home.homeRecord || form.away.awayRecord) && (
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-xs text-muted uppercase tracking-wider">Дома / На выезде</p>
          {form.home.homeRecord && (
            <FormRow team={`${homeTeam} (Д)`} results={form.home.homeRecord} />
          )}
          {form.away.awayRecord && (
            <FormRow team={`${awayTeam} (В)`} results={form.away.awayRecord} />
          )}
        </div>
      )}

      {/* H2H */}
      <div className="border-t border-border-secondary pt-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-3">Личные встречи</p>

        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-sm font-medium text-text">{homeTeam}</span>
          <span className="font-display text-2xl text-text tabular-nums">
            {h2h.homeWins} <span className="text-muted text-lg">:</span> {h2h.awayWins}
          </span>
          <span className="text-sm font-medium text-text">{awayTeam}</span>
        </div>

        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          <div className="bg-accent transition-all duration-500" style={{ width: `${homePct}%` }} />
          <div className="bg-border-secondary transition-all duration-500" style={{ width: `${drawPct}%` }} />
          <div className="bg-bg-inner flex-1" />
        </div>

        {h2h.recentGames.length > 0 && (
          <div className="flex flex-col gap-2">
            {h2h.recentGames.slice(0, 3).map((g, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-text-secondary">
                <span className="text-muted w-24">{g.date}</span>
                <span className="font-medium text-text tabular-nums">{g.score}</span>
                <span className="text-muted w-20 text-right">{g.competition}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis text */}
      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
