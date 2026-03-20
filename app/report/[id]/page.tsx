export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { FullReport } from '@/lib/types/report'
import { ReportView } from './report-view'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = createServiceClient()

  const { data: report } = await db
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (!report) notFound()

  const date = new Date(report.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Detect format: new (FullReport with matchData/analysis) vs old (flat MatchReport)
  const raw = report.structured_report as Record<string, unknown> | null
  const isNewFormat = raw && 'matchData' in raw && 'analysis' in raw

  return (
    <ReportView
      query={report.query}
      date={date}
      status={report.status}
      summary={report.summary}
      structured={isNewFormat ? (raw as unknown as FullReport) : null}
      legacySummary={!isNewFormat ? report.summary : null}
    />
  )
}
