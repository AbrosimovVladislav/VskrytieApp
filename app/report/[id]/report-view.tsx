'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FullReport } from '@/lib/types/report'
import {
  ContextSection, FormSection, StatsSection, InjuriesSection,
  ContextFactorsSection, OddsSection, RecommendationSection,
} from '@/components/report'

interface ReportViewProps {
  query: string
  date: string
  status: string
  summary: string | null
  structured: FullReport | null
  legacySummary?: string | null | undefined
}

export function ReportView({ query, date, status, summary, structured, legacySummary }: ReportViewProps) {
  const router = useRouter()

  // Fallback: no structured data (old format or still processing)
  if (!structured) {
    return (
      <div className="flex flex-col px-4 pt-8 gap-5 pb-28">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted text-sm w-fit">
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text">{query}</h1>
          <p className="text-xs text-muted">{date}</p>
        </div>
        {status === 'processing' && (
          <div className="rounded-[--radius-card] bg-bg-card border border-border px-4 py-4 text-sm text-text-secondary">
            Отчёт ещё формируется…
          </div>
        )}
        {(summary || legacySummary) && (
          <div className="rounded-[--radius-card] bg-bg-card border border-border px-4 py-4">
            <div className="text-sm leading-relaxed text-text whitespace-pre-wrap">{summary || legacySummary}</div>
          </div>
        )}
      </div>
    )
  }

  const { matchData, analysis } = structured
  const homeTeam = matchData.context.homeTeam
  const awayTeam = matchData.context.awayTeam

  return (
    <div className="flex flex-col px-4 pt-8 gap-4 pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted text-sm w-fit">
        <ArrowLeft size={16} />
        Назад
      </button>

      <ContextSection context={matchData.context} />

      <FormSection
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        form={matchData.form}
        h2h={matchData.h2h}
        analysis={analysis.sections.formAnalysis}
      />

      <StatsSection
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        home={matchData.stats.home}
        away={matchData.stats.away}
        analysis={analysis.sections.statsAnalysis}
      />

      <InjuriesSection
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        home={matchData.injuries.home}
        away={matchData.injuries.away}
        analysis={analysis.sections.injuriesAnalysis}
      />

      <ContextFactorsSection
        contextFactors={matchData.contextFactors}
        analysis={analysis.sections.contextAnalysis}
      />

      <OddsSection
        bookmakers={matchData.odds.bookmakers}
        oddsAnalysis={analysis.odds}
        analysis={analysis.sections.oddsAnalysis}
      />

      <RecommendationSection recommendation={analysis.recommendation} />
    </div>
  )
}
