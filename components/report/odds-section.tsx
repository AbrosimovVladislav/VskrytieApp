'use client'

interface BookmakerOdds {
  name: string
  home: number
  draw: number
  away: number
}

interface OddsSectionProps {
  bookmakers: BookmakerOdds[]
}

export function OddsSection({ bookmakers }: OddsSectionProps) {
  if (!bookmakers.length) return null

  // Calculate averages
  const avg = {
    home: bookmakers.reduce((s, b) => s + b.home, 0) / bookmakers.length,
    draw: bookmakers.reduce((s, b) => s + b.draw, 0) / bookmakers.length,
    away: bookmakers.reduce((s, b) => s + b.away, 0) / bookmakers.length,
  }

  // Find best odds for each outcome
  const bestHome = bookmakers.reduce((best, b) => b.home > best.home ? b : best, bookmakers[0])
  const minOdds = Math.min(avg.home, avg.draw, avg.away)
  const bestLabel = minOdds === avg.home ? `П1: ${bestHome.home.toFixed(2)} (${bestHome.name})` :
    minOdds === avg.away ? null : null

  // Find the overall favorite
  const favoriteOdds = Math.min(avg.home, avg.draw, avg.away)
  let favoriteLabel = ''
  if (favoriteOdds === avg.home) {
    const best = bookmakers.reduce((b, c) => c.home > b.home ? c : b, bookmakers[0])
    favoriteLabel = `Лучший коэф на П1: ${best.home.toFixed(2)} (${best.name})`
  } else if (favoriteOdds === avg.away) {
    const best = bookmakers.reduce((b, c) => c.away > b.away ? c : b, bookmakers[0])
    favoriteLabel = `Лучший коэф на П2: ${best.away.toFixed(2)} (${best.name})`
  }

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">КОЭФФИЦИЕНТЫ</h3>

      {/* Table header */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <span />
        <span className="text-xs text-muted text-center uppercase">П1</span>
        <span className="text-xs text-muted text-center uppercase">Х</span>
        <span className="text-xs text-muted text-center uppercase">П2</span>
      </div>

      <div className="border-t border-border-secondary" />

      {/* Bookmaker rows */}
      {bookmakers.map((b, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 py-2">
          <span className="text-sm text-text-secondary truncate">{b.name}</span>
          <span className="text-sm font-medium text-text text-center tabular-nums">{b.home.toFixed(2)}</span>
          <span className="text-sm font-medium text-text text-center tabular-nums">{b.draw.toFixed(2)}</span>
          <span className="text-sm font-medium text-text text-center tabular-nums">{b.away.toFixed(2)}</span>
        </div>
      ))}

      <div className="border-t border-border-secondary" />

      {/* Average row */}
      <div className="grid grid-cols-4 gap-2 py-2">
        <span className="text-sm text-text-secondary">Среднее</span>
        <span className="text-sm text-text-secondary text-center tabular-nums">{avg.home.toFixed(2)}</span>
        <span className="text-sm text-text-secondary text-center tabular-nums">{avg.draw.toFixed(2)}</span>
        <span className="text-sm text-text-secondary text-center tabular-nums">{avg.away.toFixed(2)}</span>
      </div>

      {/* Best odds */}
      {favoriteLabel && (
        <p className="text-sm font-semibold text-accent mt-3">{favoriteLabel}</p>
      )}
    </div>
  )
}
