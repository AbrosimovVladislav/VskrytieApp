'use client'

import { useState, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'

type StepStatus = 'pending' | 'active' | 'done'
type AppStatus = 'idle' | 'running' | 'done' | 'error'

const STEPS = [
  { id: 1, label: 'Определяем' },
  { id: 2, label: 'Создаём' },
  { id: 3, label: 'Статистика' },
  { id: 4, label: 'Аналитика' },
  { id: 5, label: 'Готово' },
]

interface MatchFound {
  teamName: string
  sport: string
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AppStatus>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [stepMessage, setStepMessage] = useState('')
  const [matchFound, setMatchFound] = useState<MatchFound | null>(null)
  const [report, setReport] = useState('')
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef('')

  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId < currentStep) return 'done'
    if (stepId === currentStep) return 'active'
    return 'pending'
  }

  const handleSubmit = async () => {
    if (!query.trim() || status === 'running') return

    setStatus('running')
    setCurrentStep(1)
    setStepMessage('Запускаем...')
    setReport('')
    setMatchFound(null)
    setError(null)
    reportRef.current = ''

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), initData: 'dev' }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue

          let event: Record<string, unknown>
          try { event = JSON.parse(json) } catch { continue }

          if (event.type === 'step') {
            setCurrentStep(event.step as number)
            setStepMessage(event.message as string)
          } else if (event.type === 'match_found') {
            setMatchFound({
              teamName: event.teamName as string,
              sport: event.sport as string,
            })
          } else if (event.type === 'chunk') {
            reportRef.current += event.content as string
            setReport(reportRef.current)
          } else if (event.type === 'done') {
            setCurrentStep(6)
            setStatus('done')
          } else if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const isRunning = status === 'running'

  return (
    <div className="flex flex-col px-4 pt-10 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">ВСКРЫТИЕ</h1>
        <p className="text-sm text-text-secondary">Аналитика матча — быстро и точно</p>
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
            placeholder="ЦСКА, Реал Мадрид или ЦСКА vs Спартак"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-secondary outline-none"
            disabled={isRunning}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isRunning}
          className="w-full h-12 rounded-xl bg-accent text-bg font-semibold text-sm tracking-wide disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
        >
          {isRunning && <Loader2 size={16} className="animate-spin" />}
          {isRunning ? stepMessage : 'Получить отчёт'}
        </button>
      </div>

      {/* Step progress */}
      {(isRunning || status === 'done') && (
        <div className="rounded-xl bg-bg-card border border-border px-4 py-4">
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => {
              const s = getStepStatus(step.id)
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      s === 'done' ? 'bg-accent' :
                      s === 'active' ? 'bg-accent animate-pulse' :
                      'bg-border'
                    }`} />
                    <span className={`text-[10px] text-center leading-tight max-w-[52px] ${
                      s === 'pending' ? 'text-muted' :
                      s === 'active' ? 'text-text font-medium' :
                      'text-text-secondary'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 mb-5 bg-border overflow-hidden">
                      <div className={`h-full bg-accent transition-all duration-500 ${
                        s === 'done' ? 'w-full' : 'w-0'
                      }`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Match found banner */}
      {matchFound && (
        <div className="rounded-xl bg-accent/10 border border-accent/30 px-4 py-3">
          <span className="text-xs text-accent font-medium uppercase tracking-wide">
            {matchFound.sport} · {matchFound.teamName}
          </span>
        </div>
      )}

      {/* Streaming report */}
      {report && (
        <div className="rounded-xl bg-bg-card border border-border px-4 py-4">
          <div className="text-sm leading-relaxed text-text whitespace-pre-wrap">{report}</div>
        </div>
      )}

      {/* Error modal */}
      {error && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setError(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-bg-card border border-red-500/40 p-5 shadow-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <span className="text-sm font-semibold text-red-400">Ошибка</span>
              <button onClick={() => setError(null)} className="text-muted hover:text-text p-1">
                <X size={16} />
              </button>
            </div>
            <pre className="text-xs text-red-300 whitespace-pre-wrap break-all font-mono overflow-y-auto">
              {error}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
