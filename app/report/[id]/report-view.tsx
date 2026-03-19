'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MatchReport } from '@/lib/types/report'
import {
  HeaderSection, FormSection, StatsSection, InjuriesSection,
  H2HSection, OddsSection, RecommendationSection,
} from '@/components/report'

interface ReportViewProps {
  query: string
  date: string
  status: string
  summary: string | null
  structured: MatchReport | null
}

export function ReportView({ query, date, status, summary, structured }: ReportViewProps) {
  const router = useRouter()

  // Fallback: no structured data yet
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
        {summary && (
          <div className="rounded-[--radius-card] bg-bg-card border border-border px-4 py-4">
            <div className="text-sm leading-relaxed text-text whitespace-pre-wrap">{summary}</div>
          </div>
        )}
      </div>
    )
  }

  const { header, form, stats, injuries, h2h, odds } = structured

  return (
    <div className="flex flex-col px-4 pt-8 gap-4 pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted text-sm w-fit">
        <ArrowLeft size={16} />
        Назад
      </button>

      <HeaderSection {...header} />

      {form && (
        <FormSection
          homeTeam={header.homeTeam}
          awayTeam={header.awayTeam}
          home={form.home}
          away={form.away}
        />
      )}

      {stats && stats.length > 0 && (
        <StatsSection
          homeTeam={header.homeTeam}
          awayTeam={header.awayTeam}
          stats={stats}
        />
      )}

      {injuries && (
        <InjuriesSection
          homeTeam={header.homeTeam}
          awayTeam={header.awayTeam}
          homeOk={injuries.homeOk}
          awayOk={injuries.awayOk}
          home={injuries.home}
          away={injuries.away}
        />
      )}

      {h2h && (
        <H2HSection
          homeTeam={header.homeTeam}
          awayTeam={header.awayTeam}
          homeWins={h2h.homeWins}
          awayWins={h2h.awayWins}
          draws={h2h.draws}
          matches={h2h.matches}
        />
      )}

      {odds && odds.bookmakers.length > 0 && (
        <OddsSection bookmakers={odds.bookmakers} />
      )}

      {summary && (
        <RecommendationSection text={summary} />
      )}
    </div>
  )
}
