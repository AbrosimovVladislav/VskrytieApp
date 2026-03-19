'use client'

type FormResult = 'W' | 'D' | 'L'

interface FormSectionProps {
  homeTeam: string
  awayTeam: string
  home: FormResult[]
  away: FormResult[]
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

function FormRow({ team, results }: { team: string; results: FormResult[] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-text w-24 truncate">{team}</span>
      <div className="flex items-center gap-1">
        {results.map((r, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${dotColor[r]}`} />
        ))}
      </div>
      <span className="text-xs text-text-secondary tabular-nums w-12 text-right">{countRecord(results)}</span>
    </div>
  )
}

export function FormSection({ homeTeam, awayTeam, home, away }: FormSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">ФОРМА (последние 5)</h3>
      <div className="flex flex-col gap-3">
        <FormRow team={homeTeam} results={home} />
        <FormRow team={awayTeam} results={away} />
      </div>
    </div>
  )
}
