'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [report, setReport] = useState('')
  const [error, setError] = useState('')
  const reportRef = useRef('')

  const handleSubmit = async () => {
    if (!query.trim() || status === 'loading' || status === 'streaming') return

    setStatus('loading')
    setStatusMsg('Запуск анализа...')
    setReport('')
    setError('')
    reportRef.current = ''

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), initData: 'dev' }),
      })

      if (!res.ok || !res.body) throw new Error('Ошибка сервера')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setStatus('streaming')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6)
          if (!json.trim()) continue

          try {
            const event = JSON.parse(json)

            if (event.type === 'status') {
              setStatusMsg(event.message)
            } else if (event.type === 'chunk') {
              reportRef.current += event.content
              setReport(reportRef.current)
            } else if (event.type === 'done') {
              setStatus('done')
              router.prefetch(`/report/${event.id}`)
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Что-то пошло не так')
    }
  }

  const isProcessing = status === 'loading' || status === 'streaming'

  return (
    <div className="flex flex-col px-4 pt-10 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          ВСКРЫТИЕ
        </h1>
        <p className="text-sm text-text-secondary">
          Аналитика матча — быстро и точно
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-bg-card border border-border rounded-xl px-4 py-3.5">
          <Search size={18} className="text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ЦСКА vs Спартак, 21 марта"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-secondary outline-none"
            disabled={isProcessing}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isProcessing}
          className="w-full h-12 rounded-xl bg-accent text-bg font-semibold text-sm tracking-wide disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
        >
          {isProcessing && <Loader2 size={16} className="animate-spin" />}
          {isProcessing ? statusMsg : 'Получить отчёт'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Streaming report */}
      {(status === 'streaming' || status === 'done') && report && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-bg-card border border-border px-4 py-4">
            <div className="prose prose-sm prose-invert max-w-none text-text text-sm leading-relaxed whitespace-pre-wrap">
              {report}
            </div>
          </div>
          {status === 'streaming' && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={12} className="animate-spin" />
              {statusMsg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
