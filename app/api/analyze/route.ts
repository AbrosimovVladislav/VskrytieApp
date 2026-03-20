import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { classifyQuery, findNextMatch, fetchMatchStats, fetchMatchData } from '@/lib/openai/client'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'
import type { MatchData, AnalysisReport, FullReport } from '@/lib/types/report'

export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
        const { query, initData } = body as { query: string; initData?: string }
        console.log('[analyze] query:', query)

        if (!query?.trim()) {
          send({ type: 'error', message: 'Запрос не может быть пустым' })
          controller.close()
          return
        }

        // Validate Telegram initData (skip in dev)
        let telegramUserId: number | null = null
        if (initData && initData !== 'dev') {
          try {
            const parsed = validateTelegramInitData(initData)
            telegramUserId = parsed.user?.id ?? null
            console.log('[analyze] telegramUserId:', telegramUserId)
          } catch (e) {
            const msg = `Невалидный initData: ${e instanceof Error ? e.message : e}`
            console.error('[analyze] initData error:', msg)
            send({ type: 'error', message: msg })
            controller.close()
            return
          }
        }

        // ── Step 1: Identify ──
        send({ type: 'step', step: 'identify', message: 'Определяем матч...' })
        console.log('[analyze] step: identify')
        const context = await classifyQuery(query)
        console.log('[analyze] context:', JSON.stringify(context))

        if (context.isTeam && context.teamName) {
          send({
            type: 'match_found',
            teamName: context.teamName,
            sport: context.sport,
          })
        }

        // Create report in Supabase
        const db = createServiceClient()

        if (telegramUserId) {
          await db.from('users').upsert(
            { telegram_user_id: telegramUserId, first_name: 'User', updated_at: new Date().toISOString() },
            { onConflict: 'telegram_user_id', ignoreDuplicates: false }
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

        console.log('[analyze] report created, id:', report.id)
        send({ type: 'id', id: report.id })

        // ── Step 2: Collect ──
        send({ type: 'step', step: 'collect', message: 'Собираем статистику...' })
        console.log('[analyze] step: collect')

        let stats: string
        let claudeContext: string

        if (context.isTeam && context.teamName) {
          const match = await findNextMatch(context.teamName, context.sport)
          console.log('[analyze] match found:', JSON.stringify(match))

          send({ type: 'step', step: 'collect', message: `${match.teamA} vs ${match.teamB} — собираем данные...` })
          stats = await fetchMatchStats(match)
          console.log('[analyze] stats length:', stats.length)

          claudeContext = `Матч: ${match.teamA} vs ${match.teamB}, ${match.date}, ${match.league}. Арена: ${match.venue}, время: ${match.time}. Анализируй именно этот матч.`
        } else {
          stats = await fetchMatchData(query, false)
          console.log('[analyze] stats length:', stats.length)
          claudeContext = `Пользователь запросил анализ матча: "${query}".`
        }

        // ── Step 3: Analyze ──
        send({ type: 'step', step: 'analyze', message: 'Анализируем данные...' })
        console.log('[analyze] step: analyze — Claude structured JSON')

        // ── Claude Call 1: MatchData JSON (non-streaming) ──
        const matchDataPrompt = `Ты — профессиональный аналитик для беттинга. ${claudeContext}

ВАЖНО: Анализируй ОБЯЗАТЕЛЬНО ОБЕ команды равноценно. Форма, голы, травмы — для каждой команды отдельно. Не игнорируй ни одну из сторон.

Данные из Perplexity (поиск по интернету):
${stats}

Верни ТОЛЬКО валидный JSON в следующем формате (без markdown, без объяснений):
{
  "context": {
    "sport": "football",
    "homeTeam": "полное название хозяев",
    "awayTeam": "полное название гостей",
    "competition": "название лиги/турнира",
    "round": "Тур N или стадия плей-офф (если известно)",
    "date": "дата матча",
    "time": "время (если известно)",
    "venue": "стадион (если известен)",
    "motivation": {
      "home": { "level": "high/medium/low", "reason": "Борьба за чемпионство" },
      "away": { "level": "high/medium/low", "reason": "Борьба за выживание" }
    }
  },
  "form": {
    "home": {
      "last5": ["W","D","L","W","W"],
      "streak": "2W",
      "homeRecord": ["W","W","D","W","L"]
    },
    "away": {
      "last5": ["L","W","W","D","L"],
      "streak": "1L",
      "awayRecord": ["L","W","D","L","W"]
    }
  },
  "h2h": {
    "homeWins": 7,
    "awayWins": 3,
    "draws": 2,
    "recentGames": [
      {"date": "15 окт 2025", "score": "2:1", "competition": "РПЛ"}
    ]
  },
  "stats": {
    "home": {
      "goalsScored": 1.6,
      "goalsConceded": 0.8,
      "xG": 1.5,
      "xGA": 0.9,
      "shotsOnTarget": 4.2,
      "possession": 55,
      "corners": 5.4,
      "yellowCards": 1.8,
      "cleanSheets": 3,
      "bttsPct": 55,
      "over25Pct": 60
    },
    "away": {
      "goalsScored": 1.2,
      "goalsConceded": 1.4,
      "xG": 1.1,
      "xGA": 1.3,
      "shotsOnTarget": 3.5,
      "possession": 48,
      "corners": 4.1,
      "yellowCards": 2.2,
      "cleanSheets": 1,
      "bttsPct": 65,
      "over25Pct": 70
    }
  },
  "injuries": {
    "home": [
      {"name": "Игрок", "role": "Нападающий", "reason": "injury", "details": "травма колена, до конца сезона", "impact": "key"}
    ],
    "away": []
  },
  "contextFactors": {
    "weather": {"temp": 5, "condition": "облачно"},
    "restDays": {"home": 5, "away": 3},
    "referee": {"name": "Иванов И.И.", "avgYellowCards": 4.2, "penaltiesPerGame": 0.3},
    "recentTransfers": ["Новичок перешёл в команду А"]
  },
  "odds": {
    "bookmakers": [
      {"name": "Фонбет", "values": {"П1": 1.85, "X": 3.40, "П2": 4.20}},
      {"name": "Бетсити", "values": {"П1": 1.90, "X": 3.35, "П2": 4.10}}
    ]
  }
}

СТРОГИЕ ПРАВИЛА:
- homeTeam и awayTeam — ПОЛНЫЕ названия (не обрезай).
- form.home.last5 и form.away.last5 — ОБЯЗАТЕЛЬНО по 5 результатов для КАЖДОЙ команды. Ноль результатов = ОШИБКА.
- stats.home и stats.away — goalsScored и goalsConceded > 0. Это средние значения за последние 5-10 матчей.
- xG/xGA — если данные есть, укажи. Если нет — поставь null.
- injuries — пустой массив если нет травм. impact обязательно для каждого: "key" (основной состав), "rotation" (ротация), "minor" (молодёжь/запас).
- contextFactors — weather null если крытый стадион. referee null если не найден. recentTransfers пустой массив если нет.
- odds.bookmakers — минимум 1 букмекер. values — минимум П1, X, П2.
- motivation — ОБЯЗАТЕЛЬНО для обеих команд. level: "high" (борьба за титул/выживание), "medium" (еврокубки/середина), "low" (ничего на кону).
- Если Perplexity не дал данные по одной команде — оцени на основе уровня команды в лиге, не оставляй пустым.
- sport: "football", "hockey", "basketball" или "tennis".`

        let matchData: MatchData | null = null

        try {
          const structuredResponse = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4096,
            messages: [{ role: 'user', content: matchDataPrompt }],
          })

          const rawText = structuredResponse.content
            .filter((block) => block.type === 'text')
            .map((block) => (block as { type: 'text'; text: string }).text)
            .join('')

          console.log('[analyze] matchData raw length:', rawText.length)

          const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
          matchData = JSON.parse(jsonText) as MatchData

          // Emit sections that come from MatchData
          send({ type: 'section', section: 'context', data: matchData.context })
          send({ type: 'section', section: 'form', data: { form: matchData.form, h2h: matchData.h2h } })
        } catch (parseErr) {
          console.error('[analyze] matchData JSON parse error:', parseErr)
          send({ type: 'error', message: 'Ошибка разбора данных матча' })
        }

        // ── Claude Call 2: AnalysisReport JSON (non-streaming) ──
        console.log('[analyze] Claude analysis report')

        const analysisPrompt = `Ты — профессиональный аналитик для беттинга. ${claudeContext}

Структурированные данные матча:
${JSON.stringify(matchData)}

На основе этих данных сгенерируй аналитический отчёт. ВСЕГДА давай прогноз на основе имеющихся данных. Никогда не отказывайся и не говори что данных недостаточно.

Верни ТОЛЬКО валидный JSON (без markdown, без объяснений):
{
  "sections": {
    "formAnalysis": "2-3 предложения: оценка формы обеих команд + учёт H2H. Конкретные факты.",
    "statsAnalysis": "2-3 предложения: xG-инсайт, сравнение ключевых метрик. Цифры обязательны.",
    "injuriesAnalysis": "1-2 предложения: влияние потерь на расклад сил.",
    "contextAnalysis": "1-2 предложения: погода, усталость, судья — если влияют.",
    "oddsAnalysis": "1-2 предложения: оценка линий, есть ли value."
  },
  "odds": {
    "average": {"П1": 1.87, "X": 3.37, "П2": 4.15},
    "bestValue": {"market": "П1", "bookmaker": "Бетсити", "odds": 1.90},
    "valueAssessment": [
      {"market": "П1", "indicator": "underpriced"},
      {"market": "X", "indicator": "fair"},
      {"market": "П2", "indicator": "overpriced"}
    ]
  },
  "recommendation": {
    "summary": "1-2 предложения: главный вывод, чёткий прогноз. Сравнительно, с цифрами.",
    "confidence": "high/medium/low",
    "bets": [
      {
        "market": "П1",
        "reasoning": "Одно предложение — почему этот рынок.",
        "confidence": "high/medium/low",
        "value": "underpriced/fair/overpriced"
      }
    ]
  }
}

ПРАВИЛА:
- sections — каждый текст на русском, связный, с конкретными цифрами и фактами. Не лей воду.
- odds.average — средние коэффициенты из данных букмекеров.
- odds.valueAssessment — для каждого основного рынка (П1, X, П2). "underpriced" = реальная вероятность выше коэффициента.
- recommendation.bets — от 1 до 3 рынков. Доступные: 1X2, тотал (Б/М), BTTS, фора, угловые (Б/М), карточки (Б/М).
- recommendation.confidence — общая уверенность в прогнозе.
- recommendation.summary — СРАВНИТЕЛЬНАЯ аналитика ОБЕИХ команд. Максимум 80-100 слов.`

        let analysisReport: AnalysisReport | null = null

        try {
          const analysisResponse = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            messages: [{ role: 'user', content: analysisPrompt }],
          })

          const rawAnalysis = analysisResponse.content
            .filter((block) => block.type === 'text')
            .map((block) => (block as { type: 'text'; text: string }).text)
            .join('')

          console.log('[analyze] analysis raw length:', rawAnalysis.length)

          const analysisJson = rawAnalysis.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
          analysisReport = JSON.parse(analysisJson) as AnalysisReport

          // Emit remaining sections with analysis texts
          send({
            type: 'section', section: 'stats',
            data: { stats: matchData?.stats, analysis: analysisReport.sections.statsAnalysis },
          })
          send({
            type: 'section', section: 'injuries',
            data: { injuries: matchData?.injuries, analysis: analysisReport.sections.injuriesAnalysis },
          })
          send({
            type: 'section', section: 'context_factors',
            data: { contextFactors: matchData?.contextFactors, analysis: analysisReport.sections.contextAnalysis },
          })
          send({
            type: 'section', section: 'odds',
            data: {
              bookmakers: matchData?.odds?.bookmakers,
              oddsAnalysis: analysisReport.odds,
              analysis: analysisReport.sections.oddsAnalysis,
            },
          })

          // Emit recommendation — summary will be "streamed" on client side
          send({
            type: 'section', section: 'recommendation',
            data: analysisReport.recommendation,
          })
        } catch (parseErr) {
          console.error('[analyze] analysis JSON parse error:', parseErr)
          send({ type: 'error', message: 'Ошибка разбора аналитики' })
        }

        // ── Save to Supabase ──
        console.log('[analyze] saving to supabase')

        const fullReport: FullReport | null = matchData && analysisReport
          ? { matchData, analysis: analysisReport }
          : null

        await db
          .from('reports')
          .update({
            raw_stats: stats,
            summary: analysisReport?.recommendation?.summary ?? '',
            structured_report: fullReport ? JSON.parse(JSON.stringify(fullReport)) : null,
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
