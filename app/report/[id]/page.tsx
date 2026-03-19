import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

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

  return (
    <div className="flex flex-col px-4 pt-8 gap-5 pb-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{report.query}</h1>
        <p className="text-xs text-muted">{date}</p>
      </div>

      {report.status === 'processing' && (
        <div className="rounded-xl bg-bg-card border border-border px-4 py-4 text-sm text-text-secondary">
          Отчёт ещё формируется…
        </div>
      )}

      {report.summary && (
        <div className="rounded-xl bg-bg-card border border-border px-4 py-4">
          <div className="text-sm leading-relaxed text-text whitespace-pre-wrap">
            {report.summary}
          </div>
        </div>
      )}
    </div>
  )
}
