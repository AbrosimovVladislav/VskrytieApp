'use client'

import type { MatchData } from '@/lib/types/report'

interface ContextSectionProps {
  context: MatchData['context']
}

const motivationColor = {
  high: 'text-positive bg-positive/10 border-positive/20',
  medium: 'text-warning bg-warning/10 border-warning/20',
  low: 'text-negative bg-negative/10 border-negative/20',
}

const motivationLabel = {
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
}

function MotivationBadge({ team, level, reason }: { team: string; level: 'high' | 'medium' | 'low'; reason: string }) {
  return (
    <div className={`rounded-[--radius-button] border px-3 py-2 ${motivationColor[level]}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-medium text-text">{team}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider">{motivationLabel[level]}</span>
      </div>
      <p className="text-xs opacity-80">{reason}</p>
    </div>
  )
}

export function ContextSection({ context }: ContextSectionProps) {
  const meta = [context.venue, context.time].filter(Boolean).join(' · ')

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <p className="text-xs uppercase tracking-wider text-muted mb-1">
        {context.competition}{context.round ? ` · ${context.round}` : ''}
      </p>
      <p className="text-xs text-muted mb-4">{context.date}{context.time ? ` · ${context.time}` : ''}</p>

      <div className="flex items-center justify-between gap-3 mb-4 min-h-14">
        <span className="text-lg font-medium text-text text-center flex-1 min-w-0 leading-snug" style={{ textWrap: 'balance' }}>{context.homeTeam}</span>
        <span className="text-sm font-medium text-muted shrink-0">VS</span>
        <span className="text-lg font-medium text-text text-center flex-1 min-w-0 leading-snug" style={{ textWrap: 'balance' }}>{context.awayTeam}</span>
      </div>

      {meta && (
        <p className="text-xs text-muted text-center mb-4">{meta}</p>
      )}

      {context.motivation && (
        <div className="flex flex-col gap-2">
          <MotivationBadge team={context.homeTeam} {...context.motivation.home} />
          <MotivationBadge team={context.awayTeam} {...context.motivation.away} />
        </div>
      )}
    </div>
  )
}
