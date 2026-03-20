'use client'

import type { BookmakerOdds, AnalysisReport } from '@/lib/types/report'

interface OddsSectionProps {
  bookmakers: BookmakerOdds[]
  oddsAnalysis?: AnalysisReport['odds']
  analysis?: string
}

const valueColor: Record<string, string> = {
  underpriced: 'text-positive bg-positive/10',
  fair: 'text-muted bg-bg-inner',
  overpriced: 'text-negative bg-negative/10',
}

const valueLabel: Record<string, string> = {
  underpriced: 'Коэф занижен',
  fair: 'В рынке',
  overpriced: 'Коэф завышен',
}

export function OddsSection({ bookmakers, oddsAnalysis, analysis }: OddsSectionProps) {
  if (!bookmakers?.length) return null

  // Get all market keys from all bookmakers
  const markets = Array.from(
    new Set(bookmakers.flatMap(b => Object.keys(b.values)))
  )

  // Calculate averages
  const averages: Record<string, number> = {}
  for (const market of markets) {
    const vals = bookmakers.map(b => b.values[market]).filter(v => v != null)
    averages[market] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  }

  // Use analysis averages if available
  const avg = oddsAnalysis?.average ?? averages

  // Find best value per market
  const bestPerMarket: Record<string, { value: number; bookmaker: string }> = {}
  for (const market of markets) {
    for (const b of bookmakers) {
      const v = b.values[market]
      if (v != null && (!bestPerMarket[market] || v > bestPerMarket[market].value)) {
        bestPerMarket[market] = { value: v, bookmaker: b.name }
      }
    }
  }

  // Value assessment map
  const assessmentMap: Record<string, string> = {}
  if (oddsAnalysis?.valueAssessment) {
    for (const va of oddsAnalysis.valueAssessment) {
      assessmentMap[va.market] = va.indicator
    }
  }

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">КОЭФФИЦИЕНТЫ</h3>

      {/* Table header */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `1fr repeat(${markets.length}, 1fr)` }}>
        <span />
        {markets.map(m => (
          <span key={m} className="text-xs text-muted text-center uppercase">{m}</span>
        ))}
      </div>

      <div className="border-t border-border-secondary" />

      {/* Bookmaker rows */}
      {bookmakers.map((b, i) => (
        <div key={i} className="grid gap-2 py-2" style={{ gridTemplateColumns: `1fr repeat(${markets.length}, 1fr)` }}>
          <span className="text-sm text-text-secondary truncate">{b.name}</span>
          {markets.map(m => {
            const val = b.values[m]
            const isBest = bestPerMarket[m]?.value === val && bestPerMarket[m]?.bookmaker === b.name
            return (
              <span key={m} className={`text-sm font-medium text-center tabular-nums ${isBest ? 'text-accent' : 'text-text'}`}>
                {val != null ? val.toFixed(2) : '—'}
              </span>
            )
          })}
        </div>
      ))}

      <div className="border-t border-border-secondary" />

      {/* Average row */}
      <div className="grid gap-2 py-2" style={{ gridTemplateColumns: `1fr repeat(${markets.length}, 1fr)` }}>
        <span className="text-sm text-text-secondary">Среднее</span>
        {markets.map(m => (
          <span key={m} className="text-sm text-text-secondary text-center tabular-nums">
            {(avg[m] ?? averages[m])?.toFixed(2) ?? '—'}
          </span>
        ))}
      </div>

      {/* Value assessment badges */}
      {Object.keys(assessmentMap).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {markets.map(m => {
            const indicator = assessmentMap[m]
            if (!indicator) return null
            return (
              <span key={m} className={`text-xs px-2 py-1 rounded ${valueColor[indicator]}`}>
                {m}: {valueLabel[indicator]}
              </span>
            )
          })}
        </div>
      )}

      {/* Analysis text */}
      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
