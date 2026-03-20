'use client'

import { Cloud, Clock, Shield, ArrowRightLeft } from 'lucide-react'
import type { ContextFactors } from '@/lib/types/report'

interface ContextFactorsSectionProps {
  contextFactors: ContextFactors
  analysis?: string
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[--radius-button] bg-bg-overlay border border-border px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-text">{value}</p>
    </div>
  )
}

export function ContextFactorsSection({ contextFactors, analysis }: ContextFactorsSectionProps) {
  const { weather, restDays, referee, recentTransfers } = contextFactors

  const hasWeather = weather && weather.temp != null && weather.condition
  const hasRestDays = restDays && (restDays.home != null || restDays.away != null)
  const hasReferee = referee && referee.name
  const hasTransfers = recentTransfers && recentTransfers.length > 0

  const hasTiles = hasWeather || hasRestDays || hasReferee || hasTransfers
  if (!hasTiles && !analysis) return null

  return (
    <div className="rounded-[--radius-card] bg-bg-card border border-border-card p-5 shadow-[--shadow-card]">
      <h3 className="text-[14px] font-semibold text-text mb-4">КОНТЕКСТНЫЕ ФАКТОРЫ</h3>

      <div className="grid grid-cols-2 gap-2">
        {hasWeather && (
          <Tile
            icon={<Cloud size={12} className="text-muted" />}
            label="Погода"
            value={`${weather!.temp}°C, ${weather!.condition}`}
          />
        )}

        {hasRestDays && (
          <Tile
            icon={<Clock size={12} className="text-muted" />}
            label="Дни отдыха"
            value={`Хозяева: ${restDays!.home ?? '?'}д · Гости: ${restDays!.away ?? '?'}д`}
          />
        )}

        {hasReferee && (
          <Tile
            icon={<Shield size={12} className="text-muted" />}
            label="Судья"
            value={[
              referee!.name,
              referee!.avgYellowCards != null ? `ЖК ${referee!.avgYellowCards}` : null,
              referee!.penaltiesPerGame != null ? `Пен ${referee!.penaltiesPerGame}/матч` : null,
            ].filter(Boolean).join(' · ')}
          />
        )}

        {hasTransfers && (
          <Tile
            icon={<ArrowRightLeft size={12} className="text-muted" />}
            label="Трансферы"
            value={recentTransfers.join(', ')}
          />
        )}
      </div>

      {analysis && (
        <p className="text-sm text-text-secondary leading-relaxed mt-4 pt-4 border-t border-border-secondary">{analysis}</p>
      )}
    </div>
  )
}
