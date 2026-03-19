'use client'

import { Zap } from 'lucide-react'

interface RecommendationSectionProps {
  text: string
  isStreaming?: boolean
}

export function RecommendationSection({ text, isStreaming = false }: RecommendationSectionProps) {
  return (
    <div className="rounded-[--radius-card] bg-bg-card-dark border border-border-card p-5 shadow-[--shadow-card]">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-accent" />
        <h3 className="text-[14px] font-semibold text-accent">АНАЛИТИКА ВСКРЫТИЕ</h3>
      </div>

      <div className="text-sm leading-relaxed text-text whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle animate-pulse" />
        )}
      </div>

      <p className="text-xs text-muted mt-4">⚠ Решение всегда за вами.</p>
    </div>
  )
}
