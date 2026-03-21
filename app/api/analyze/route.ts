import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'
import { identifyMatch, collectStats, collectContext } from '@/lib/perplexity/client'
import { analyzeMatch } from '@/lib/claude/client'
import type { MatchData, FullReport } from '@/lib/types/report'

export const maxDuration = 120

const VALID_SPORTS = ['football', 'hockey', 'basketball'] as const
type Sport = (typeof VALID_SPORTS)[number]

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(sse(data)))
      }

      try {
        const body = await req.json()
        const { query, initData, sport: selectedSport } = body as {
          query: string
          initData?: string
          sport?: string
        }
        console.log('[analyze] query:', query, 'sport:', selectedSport)

        // ── Step 1: Validate ──
        send({ type: 'step', step: 'validate', message: 'Проверяем запрос...' })

        if (!query?.trim()) {
          send({ type: 'error', message: 'Запрос не может быть пустым' })
          controller.close()
          return
        }

        const sport: Sport = VALID_SPORTS.includes(selectedSport as Sport)
          ? (selectedSport as Sport)
          : 'football'

        // Validate Telegram initData (skip in dev)
        let telegramUserId: number | null = null
        if (initData && initData !== 'dev') {
          try {
            const parsed = validateTelegramInitData(initData)
            telegramUserId = parsed.user?.id ?? null
          } catch (e) {
            const msg = `Невалидный initData: ${e instanceof Error ? e.message : e}`
            console.error('[analyze] initData error:', msg)
            send({ type: 'error', message: msg })
            controller.close()
            return
          }
        }

        // Create report in Supabase
        const db = createServiceClient()

        if (telegramUserId) {
          await db.from('users').upsert(
            { telegram_user_id: telegramUserId, first_name: 'User', updated_at: new Date().toISOString() },
            { onConflict: 'telegram_user_id', ignoreDuplicates: false },
          )
        }

        const { data: report, error: reportError } = await db
          .from('reports')
          .insert({ query, telegram_user_id: telegramUserId ?? null, status: 'pending' })
          .select('id')
          .single()

        if (reportError || !report) {
          const msg = `Ошибка создания отчёта: ${reportError?.message ?? 'нет данных'}`
          console.error('[analyze] supabase error:', msg)
          send({ type: 'error', message: msg })
          controller.close()
          return
        }

        send({ type: 'id', id: report.id })

        // ── Perplexity Step 1: Identify match (multi-agent) ──
        send({ type: 'step', step: 'collect', message: 'Ищем матч (3 агента)...' })
        console.log('[analyze] Step 1: identifying match (multi-agent)')

        const matchContext = await identifyMatch(query, sport, (msg) => {
          send({ type: 'step', step: 'collect', message: msg })
        })
        console.log('[analyze] Match identified:', matchContext.homeTeam, 'vs', matchContext.awayTeam)

        // Send match_found + context section immediately
        send({
          type: 'match_found',
          teamName: `${matchContext.homeTeam} vs ${matchContext.awayTeam}`,
          sport,
        })
        // Context section without motivation yet (will be updated after step 3)
        send({
          type: 'section', section: 'context',
          data: {
            ...matchContext,
            motivation: undefined,
          },
        })

        // ── Perplexity Steps 2+3 in parallel ──
        send({ type: 'step', step: 'collect', message: 'Собираем данные...' })
        console.log('[analyze] Perplexity Steps 2+3: collecting stats + context in parallel')

        const [statsData, contextData] = await Promise.all([
          collectStats(matchContext),
          collectContext(matchContext),
        ])

        // Assemble full MatchData
        const matchData: MatchData = {
          context: {
            ...matchContext,
            motivation: contextData.motivation,
          },
          form: statsData.form,
          h2h: statsData.h2h,
          stats: statsData.stats,
          injuries: contextData.injuries,
          contextFactors: contextData.contextFactors,
          odds: statsData.odds,
        }

        // Emit data sections
        send({
          type: 'section', section: 'context',
          data: matchData.context,
        })
        send({ type: 'section', section: 'form', data: { form: matchData.form, h2h: matchData.h2h } })
        send({ type: 'section', section: 'stats', data: { stats: matchData.stats } })
        send({ type: 'section', section: 'injuries', data: { injuries: matchData.injuries } })
        send({ type: 'section', section: 'context_factors', data: { contextFactors: matchData.contextFactors } })
        send({ type: 'section', section: 'odds', data: { bookmakers: matchData.odds.bookmakers } })

        // ── Claude Analysis ──
        send({ type: 'step', step: 'analyze', message: 'Анализируем данные...' })
        console.log('[analyze] Claude: analyzing match data')

        const analysisReport = await analyzeMatch(matchData)

        // Emit analysis sections
        send({
          type: 'section', section: 'stats',
          data: { stats: matchData.stats, analysis: analysisReport.sections.statsAnalysis },
        })
        send({
          type: 'section', section: 'injuries',
          data: { injuries: matchData.injuries, analysis: analysisReport.sections.injuriesAnalysis },
        })
        send({
          type: 'section', section: 'context_factors',
          data: { contextFactors: matchData.contextFactors, analysis: analysisReport.sections.contextAnalysis },
        })
        send({
          type: 'section', section: 'odds',
          data: {
            bookmakers: matchData.odds.bookmakers,
            oddsAnalysis: analysisReport.odds,
            analysis: analysisReport.sections.oddsAnalysis,
          },
        })
        send({
          type: 'section', section: 'recommendation',
          data: analysisReport.recommendation,
        })

        // Save to Supabase
        const fullReport: FullReport = { matchData, analysis: analysisReport }

        await db
          .from('reports')
          .update({
            raw_stats: JSON.stringify(matchData),
            summary: analysisReport.recommendation.summary,
            structured_report: JSON.parse(JSON.stringify(fullReport)),
            status: 'completed',
          })
          .eq('id', report.id)

        send({ type: 'done', id: report.id })
        console.log('[analyze] done')
      } catch (err) {
        const message = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err)
        console.error('[analyze] FATAL ERROR:', message, err instanceof Error ? err.stack : '')
        controller.enqueue(encoder.encode(sse({ type: 'error', message })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
