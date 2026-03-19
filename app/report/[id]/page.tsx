export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MatchReport } from '@/lib/types/report'
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

  const structured = report.structured_report as MatchReport | null

  return (
    <ReportView
      query={report.query}
      date={date}
      status={report.status}
      summary={report.summary}
      structured={structured}
    />
  )
}
