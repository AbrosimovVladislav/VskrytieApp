'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { MatchReport } from '@/lib/types/report'
import {
  HeaderSection, FormSection, StatsSection, InjuriesSection,
  H2HSection, OddsSection, RecommendationSection,
  HeaderSkeleton, FormSkeleton, StatsSkeleton, InjuriesSkeleton,
  H2HSkeleton, OddsSkeleton, RecommendationSkeleton,
} from '@/components/report'

type StepStatus = 'pending' | 'active' | 'done'
type AppStatus = 'idle' | 'running' | 'done' | 'error'

const STEPS = [
  { id: 1, label: 'Определяем' },
  { id: 2, label: 'Создаём' },
  { id: 3, label: 'Статистика' },
  { id: 4, label: 'Аналитика' },
  { id: 5, label: 'Готово' },
]

type SectionName = keyof MatchReport

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
  const [error, setError] = useState<string | null>(null)

  // Structured report sections
  const [sections, setSections] = useState<Partial<MatchReport>>({})
  const [visibleSections, setVisibleSections] = useState<Set<SectionName>>(new Set())
  const [recommendation, setRecommendation] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const recommendationRef = useRef('')

  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId < currentStep) return 'done'
    if (stepId === currentStep) return 'active'
    return 'pending'
  }

  const addSection = useCallback((name: SectionName, data: unknown) => {
    setSections(prev => ({ ...prev, [name]: data }))
    // Small delay for staggered animation
    setTimeout(() => {
      setVisibleSections(prev => new Set(prev).add(name))
    }, 50)
  }, [])

  const handleSubmit = async () => {
    if (!query.trim() || status === 'running') return

    setStatus('running')
    setCurrentStep(1)
    setStepMessage('Запускаем...')
    setMatchFound(null)
    setError(null)
    setSections({})
    setVisibleSections(new Set())
    setRecommendation('')
    setIsStreaming(false)
    recommendationRef.current = ''

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
            if ((event.step as number) === 5) setIsStreaming(true)
          } else if (event.type === 'match_found') {
            setMatchFound({
              teamName: event.teamName as string,
              sport: event.sport as string,
            })
          } else if (event.type === 'section') {
            addSection(event.section as SectionName, event.data)
          } else if (event.type === 'chunk') {
            recommendationRef.current += event.content as string
            setRecommendation(recommendationRef.current)
          } else if (event.type === 'done') {
            setCurrentStep(6)
            setStatus('done')
            setIsStreaming(false)
          } else if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }
    } catch (err) {
      setStatus('error')
      setIsStreaming(false)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const isRunning = status === 'running'
  const showReport = isRunning || status === 'done'
  const showSkeletons = isRunning

  // Section order as per ui-flow
  const sectionOrder: SectionName[] = ['header', 'form', 'stats', 'injuries', 'h2h', 'odds']

  return (
    <div className="flex flex-col px-4 pt-10 gap-6 pb-28">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-accent">ВСКРЫТИЕ</h1>
        <p className="text-sm text-muted">Аналитика матча — быстро и точно</p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-bg-card border border-border rounded-[--radius-button] px-4 py-3.5 shadow-[--shadow-light]">
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ЦСКА, Реал Мадрид или ЦСКА vs Спартак"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-none"
            disabled={isRunning}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isRunning}
          className="w-full h-12 rounded-[--radius-button] bg-accent text-bg-card-dark font-semibold text-sm tracking-wide disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
        >
          {isRunning && <Loader2 size={16} className="animate-spin" />}
          {isRunning ? stepMessage : 'Получить отчёт'}
        </button>
      </div>

      {/* Step progress */}
      {(isRunning || status === 'done') && (
        <div className="rounded-[--radius-card] bg-bg-overlay border border-border px-4 py-4">
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => {
              const s = getStepStatus(step.id)
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      s === 'done' ? 'bg-accent' :
                      s === 'active' ? 'bg-accent animate-pulse' :
                      'bg-border-secondary'
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
                    <div className="flex-1 h-px mx-1 mb-5 bg-border-secondary overflow-hidden">
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
        <div className="rounded-[--radius-button] bg-accent-dim border border-border-accent px-4 py-3">
          <span className="text-xs text-accent font-semibold uppercase tracking-wide">
            {matchFound.sport} · {matchFound.teamName}
          </span>
        </div>
      )}

      {/* Report sections */}
      {showReport && (
        <div className="flex flex-col gap-4">
          {sectionOrder.map((name) => {
            const data = sections[name]
            const visible = visibleSections.has(name)

            // Show skeleton if running and section not received yet
            if (!data && showSkeletons) {
              const Skeleton = {
                header: HeaderSkeleton,
                form: FormSkeleton,
                stats: StatsSkeleton,
                injuries: InjuriesSkeleton,
                h2h: H2HSkeleton,
                odds: OddsSkeleton,
              }[name]
              return Skeleton ? <Skeleton key={name} /> : null
            }

            if (!data) return null

            return (
              <div
                key={name}
                className={`transition-all duration-300 ease-out ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                {name === 'header' && <HeaderSection {...(data as MatchReport['header'])} />}
                {name === 'form' && sections.header && (
                  <FormSection
                    homeTeam={sections.header.homeTeam}
                    awayTeam={sections.header.awayTeam}
                    {...(data as MatchReport['form'])}
                  />
                )}
                {name === 'stats' && sections.header && (
                  <StatsSection
                    homeTeam={sections.header.homeTeam}
                    awayTeam={sections.header.awayTeam}
                    stats={data as MatchReport['stats']}
                  />
                )}
                {name === 'injuries' && sections.header && (
                  <InjuriesSection
                    homeTeam={sections.header.homeTeam}
                    awayTeam={sections.header.awayTeam}
                    {...(data as MatchReport['injuries'])}
                  />
                )}
                {name === 'h2h' && sections.header && (
                  <H2HSection
                    homeTeam={sections.header.homeTeam}
                    awayTeam={sections.header.awayTeam}
                    {...(data as MatchReport['h2h'])}
                  />
                )}
                {name === 'odds' && <OddsSection bookmakers={(data as MatchReport['odds']).bookmakers} />}
              </div>
            )
          })}

          {/* Recommendation */}
          {recommendation ? (
            <div className={`transition-all duration-300 ease-out ${
              recommendation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}>
              <RecommendationSection text={recommendation} isStreaming={isStreaming} />
            </div>
          ) : showSkeletons ? (
            <RecommendationSkeleton />
          ) : null}
        </div>
      )}

      {/* Error modal */}
      {error && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setError(null)}
        >
          <div
            className="w-full max-w-md rounded-[--radius-card] bg-bg-card border border-negative/40 p-5 shadow-[--shadow-card] max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              <span className="text-sm font-semibold text-negative">Ошибка</span>
              <button onClick={() => setError(null)} className="text-muted hover:text-text p-1">
                <X size={16} />
              </button>
            </div>
            <pre className="text-xs text-negative/80 whitespace-pre-wrap break-all font-mono overflow-y-auto">
              {error}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
