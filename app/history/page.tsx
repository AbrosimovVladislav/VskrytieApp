export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default async function HistoryPage() {
  const db = createServiceClient()

  const { data: reports } = await db
    .from('reports')
    .select('id, query, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col px-4 pt-8 gap-5">
      <h1 className="text-xl font-semibold text-text">История</h1>

      {!reports?.length && (
        <p className="text-sm text-text-secondary">Отчётов пока нет</p>
      )}

      <div className="flex flex-col gap-2">
        {reports?.map((r: { id: string; query: string; status: string; created_at: string }) => {
          const date = new Date(r.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <Link
              key={r.id}
              href={`/report/${r.id}`}
              className="flex items-center justify-between bg-bg-card border border-border rounded-xl px-4 py-3 hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-text truncate">
                  {r.query}
                </span>
                <span className="text-xs text-muted">{date}</span>
              </div>
              <ChevronRight size={16} className="text-muted shrink-0 ml-2" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
