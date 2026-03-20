'use client'

import { Zap } from 'lucide-react'
import type { AnalysisReport } from '@/lib/types/report'

type Recommendation = AnalysisReport['recommendation']

interface RecommendationSectionProps {
  recommendation: Recommendation
  isStreaming?: boolean
}

const confidenceConfig = {
  high: { label: 'Высокая', color: 'text-positive', dots: 3 },
  medium: { label: 'Средняя', color: 'text-warning', dots: 2 },
  low: { label: 'Низкая', color: 'text-negative', dots: 1 },
}

const valueColor: Record<string, string> = {
  underpriced: 'text-positive bg-positive/10',
  fair: 'text-muted bg-bg-inner',
  overpriced: 'text-negative bg-negative/10',
}

const valueLabel: Record<string, string> = {
  underpriced: 'Занижен',
  fair: 'В рынке',
  overpriced: 'Завышен',
}

function ConfidenceDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cfg = confidenceConfig[level]
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-100 ${i <= cfg.dots ? 'bg-accent' : 'bg-bg-inner'}`}
        />
      ))}
      <span className={`text-xs font-medium ml-1 ${cfg.color}`}>{cfg.label}</span>
    </div>
  )
}

function BetCard({ bet }: { bet: Recommendation['bets'][number] }) {
  return (
    <div className="rounded-[--radius-button] bg-bg-overlay border border-border px-3 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-text">{bet.market}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${valueColor[bet.value]}`}>
          {valueLabel[bet.value]}
        </span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{bet.reasoning}</p>
      <div className="mt-2">
        <ConfidenceDots level={bet.confidence} />
      </div>
    </div>
  )
}

export function RecommendationSection({ recommendation, isStreaming = false }: RecommendationSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card-dark border border-border-card p-5 shadow-[--shadow-card]">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-accent" />
        <h3 className="text-[14px] font-semibold text-accent">РЕКОМЕНДАЦИЯ</h3>
      </div>

      {/* Confidence */}
      <div className="mb-3">
        <ConfidenceDots level={recommendation.confidence} />
      </div>

      {/* Summary */}
      <div className="text-sm leading-relaxed text-text whitespace-pre-wrap mb-4">
        {recommendation.summary}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle animate-pulse" />
        )}
      </div>

      {/* Bet cards */}
      {recommendation.bets && recommendation.bets.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {recommendation.bets.map((bet, i) => (
            <BetCard key={i} bet={bet} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Решение всегда за вами. ВСКРЫТИЕ предоставляет аналитику, не финансовые рекомендации.
      </p>
    </div>
  )
}
