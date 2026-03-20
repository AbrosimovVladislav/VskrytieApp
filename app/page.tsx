'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import type { MatchData, AnalysisReport } from '@/lib/types/report'
import {
  ContextSection, FormSection, StatsSection, InjuriesSection,
  ContextFactorsSection, OddsSection, RecommendationSection,
  ContextSkeleton, FormSkeleton, StatsSkeleton, InjuriesSkeleton,
  ContextFactorsSkeleton, OddsSkeleton, RecommendationSkeleton,
} from '@/components/report'

type StepStatus = 'pending' | 'active' | 'done'
type AppStatus = 'idle' | 'running' | 'done' | 'error'

const STEPS = [
  { id: 'identify', label: 'Определяем' },
  { id: 'collect', label: 'Статистика' },
  { id: 'analyze', label: 'Аналитика' },
]

const STEP_ORDER = STEPS.map(s => s.id)

type SectionName = 'context' | 'form' | 'stats' | 'injuries' | 'context_factors' | 'odds' | 'recommendation'

interface MatchFound {
  teamName: string
  sport: string
}

// Section data types from SSE
interface SectionData {
  context?: MatchData['context']
  form?: { form: MatchData['form']; h2h: MatchData['h2h'] }
  stats?: { stats: MatchData['stats']; analysis: string }
  injuries?: { injuries: MatchData['injuries']; analysis: string }
  context_factors?: { contextFactors: MatchData['contextFactors']; analysis: string }
  odds?: { bookmakers: MatchData['odds']['bookmakers']; oddsAnalysis: AnalysisReport['odds']; analysis: string }
  recommendation?: AnalysisReport['recommendation']
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AppStatus>('idle')
  const [currentStep, setCurrentStep] = useState('')
  const [stepMessage, setStepMessage] = useState('')
  const [matchFound, setMatchFound] = useState<MatchFound | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [sections, setSections] = useState<SectionData>({})
  const [visibleSections, setVisibleSections] = useState<Set<SectionName>>(new Set())

  // For simulated streaming of recommendation summary
  const [streamedSummary, setStreamedSummary] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getStepStatus = (stepId: string): StepStatus => {
    const currentIdx = STEP_ORDER.indexOf(currentStep)
    const stepIdx = STEP_ORDER.indexOf(stepId)
    if (currentIdx < 0) return 'pending'
    if (stepIdx < currentIdx) return 'done'
    if (stepIdx === currentIdx) return 'active'
    return 'pending'
  }

  const addSection = useCallback((name: SectionName, data: unknown) => {
    setSections(prev => ({ ...prev, [name]: data }))
    setTimeout(() => {
      setVisibleSections(prev => new Set(prev).add(name))
    }, 50)
  }, [])

  // Simulate streaming for recommendation summary
  const simulateStream = useCallback((fullText: string) => {
    setIsStreaming(true)
    setStreamedSummary('')
    let idx = 0
    streamTimerRef.current = setInterval(() => {
      idx += 2
      if (idx >= fullText.length) {
        setStreamedSummary(fullText)
        setIsStreaming(false)
        if (streamTimerRef.current) clearInterval(streamTimerRef.current)
      } else {
        setStreamedSummary(fullText.slice(0, idx))
      }
    }, 15)
  }, [])

  const handleSubmit = async () => {
    if (!query.trim() || status === 'running') return

    setStatus('running')
    setCurrentStep('identify')
    setStepMessage('Запускаем...')
    setMatchFound(null)
    setError(null)
    setSections({})
    setVisibleSections(new Set())
    setStreamedSummary('')
    setIsStreaming(false)
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)

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
            setCurrentStep(event.step as string)
            setStepMessage(event.message as string)
          } else if (event.type === 'match_found') {
            setMatchFound({
              teamName: event.teamName as string,
              sport: event.sport as string,
            })
          } else if (event.type === 'section') {
            const name = event.section as SectionName
            addSection(name, event.data)

            // Start streaming simulation when recommendation arrives
            if (name === 'recommendation') {
              const rec = event.data as AnalysisReport['recommendation']
              if (rec?.summary) {
                simulateStream(rec.summary)
              }
            }
          } else if (event.type === 'done') {
            setCurrentStep('done')
            setStatus('done')
          } else if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }
    } catch (err) {
      setStatus('error')
      setIsStreaming(false)
      if (streamTimerRef.current) clearInterval(streamTimerRef.current)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const isRunning = status === 'running'
  const showReport = isRunning || status === 'done'
  const showSkeletons = isRunning

  const sectionOrder: SectionName[] = ['context', 'form', 'stats', 'injuries', 'context_factors', 'odds', 'recommendation']

  // Extract team names from context section
  const homeTeam = sections.context?.homeTeam ?? ''
  const awayTeam = sections.context?.awayTeam ?? ''

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

      {/* Step progress (3 steps) */}
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
                context: ContextSkeleton,
                form: FormSkeleton,
                stats: StatsSkeleton,
                injuries: InjuriesSkeleton,
                context_factors: ContextFactorsSkeleton,
                odds: OddsSkeleton,
                recommendation: RecommendationSkeleton,
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
                {name === 'context' && sections.context && (
                  <ContextSection context={sections.context} />
                )}
                {name === 'form' && sections.form && (
                  <FormSection
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    form={sections.form.form}
                    h2h={sections.form.h2h}
                    analysis={sections.stats?.analysis}
                  />
                )}
                {name === 'stats' && sections.stats && (
                  <StatsSection
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    home={sections.stats.stats.home}
                    away={sections.stats.stats.away}
                    analysis={sections.stats.analysis}
                  />
                )}
                {name === 'injuries' && sections.injuries && (
                  <InjuriesSection
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    home={sections.injuries.injuries.home}
                    away={sections.injuries.injuries.away}
                    analysis={sections.injuries.analysis}
                  />
                )}
                {name === 'context_factors' && sections.context_factors && (
                  <ContextFactorsSection
                    contextFactors={sections.context_factors.contextFactors}
                    analysis={sections.context_factors.analysis}
                  />
                )}
                {name === 'odds' && sections.odds && (
                  <OddsSection
                    bookmakers={sections.odds.bookmakers}
                    oddsAnalysis={sections.odds.oddsAnalysis}
                    analysis={sections.odds.analysis}
                  />
                )}
                {name === 'recommendation' && sections.recommendation && (
                  <RecommendationSection
                    recommendation={{
                      summary: isStreaming ? streamedSummary : sections.recommendation.summary,
                      confidence: sections.recommendation.confidence,
                      bets: sections.recommendation.bets,
                    }}
                    isStreaming={isStreaming}
                  />
                )}
              </div>
            )
          })}
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
