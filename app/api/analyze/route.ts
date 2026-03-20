import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'
import type { MatchData, AnalysisReport, FullReport } from '@/lib/types/report'
import type { Sport } from '@/lib/sports-api/client'
import { searchTeams, findNextFixture } from '@/lib/sports-api/client'
import { buildMatchDataFromAPI } from '@/lib/sports-api/mappers'
import { fetchMatchStats, fetchMatchData, classifyQuery, findNextMatch } from '@/lib/openai/client'

export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SPORTS_API_KEY = process.env.SPORTS_API_KEY ?? ''

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
          sport?: Sport
        }
        console.log('[analyze] query:', query, 'sport:', selectedSport)

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

        send({ type: 'id', id: report.id })

        // Decide pipeline: Sports API (if key present and sport selected) or Perplexity fallback
        const useSportsAPI = !!SPORTS_API_KEY && !!selectedSport

        let matchData: MatchData | null = null
        let rawStats: string = ''

        if (useSportsAPI) {
          try {
            matchData = await runSportsAPIPipeline(send, query, selectedSport!, db)
            rawStats = JSON.stringify(matchData)
          } catch (err) {
            console.warn('[analyze] Sports API failed, falling back to Perplexity:', err)
            send({ type: 'step', step: 'identify', message: 'Sports API недоступен, переключаемся...' })
            // Fall through to Perplexity
          }
        }

        // Perplexity fallback
        if (!matchData) {
          const result = await runPerplexityPipeline(send, query)
          rawStats = result.rawStats
          matchData = result.matchData
        }

        // ── Step 5 (or 3 in fallback): Analyze (Claude) ──
        send({ type: 'step', step: 'analyze', message: 'Анализируем данные...' })

        // Emit MatchData sections
        if (matchData) {
          send({ type: 'section', section: 'context', data: matchData.context })
          send({ type: 'section', section: 'form', data: { form: matchData.form, h2h: matchData.h2h } })
        }

        // Claude analysis (single call — MatchData already structured)
        const analysisReport = await runClaudeAnalysis(matchData)

        if (analysisReport) {
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
          send({
            type: 'section', section: 'recommendation',
            data: analysisReport.recommendation,
          })
        }

        // Save to Supabase
        const fullReport: FullReport | null = matchData && analysisReport
          ? { matchData, analysis: analysisReport }
          : null

        await db
          .from('reports')
          .update({
            raw_stats: rawStats,
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

// ══════════════════════════════════════════════════
// Sports API Pipeline (5 steps)
// ══════════════════════════════════════════════════

async function runSportsAPIPipeline(
  send: (data: object) => void,
  query: string,
  sport: Sport,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _db: any,
): Promise<MatchData> {
  // ── Step 1: Find team ──
  send({ type: 'step', step: 'search', message: 'Ищем команду...' })
  console.log('[analyze] Sports API step 1: search team')

  const teams = await searchTeams(sport, query.trim())
  if (!teams.length) {
    throw new Error(`Команда "${query}" не найдена в ${sport} API`)
  }

  const team = teams[0]
  console.log('[analyze] found team:', team.name, 'id:', team.id)
  send({ type: 'match_found', teamName: team.name, sport })

  // ── Step 2: Find next fixture ──
  send({ type: 'step', step: 'fixture', message: 'Ищем ближайший матч...' })
  console.log('[analyze] Sports API step 2: find fixture')

  const fixture = await findNextFixture(sport, team.id)
  if (!fixture) {
    throw new Error(`Нет запланированных матчей для ${team.name}`)
  }

  console.log('[analyze] fixture:', fixture.homeTeam.name, 'vs', fixture.awayTeam.name)
  send({ type: 'step', step: 'fixture', message: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}` })

  // ── Step 3: Collect structured data (parallel) ──
  send({ type: 'step', step: 'collect', message: 'Собираем статистику...' })
  console.log('[analyze] Sports API step 3: collect data (~10 parallel requests)')

  const partialMatchData = await buildMatchDataFromAPI(sport, fixture)

  // ── Step 4: Context from Perplexity (parallel with step 3 in future, sequential now) ──
  send({ type: 'step', step: 'context', message: 'Собираем контекст...' })
  console.log('[analyze] step 4: Perplexity context')

  const contextFactors = await fetchContextFromPerplexity(
    fixture.homeTeam.name,
    fixture.awayTeam.name,
    fixture.league.name,
    partialMatchData.context.date,
    partialMatchData.context.venue,
  )

  const matchData: MatchData = {
    ...partialMatchData,
    contextFactors,
  }

  return matchData
}

// ══════════════════════════════════════════════════
// Perplexity Fallback Pipeline (original 3 steps)
// ══════════════════════════════════════════════════

async function runPerplexityPipeline(
  send: (data: object) => void,
  query: string,
): Promise<{ rawStats: string; matchData: MatchData | null }> {
  // Step 1: Identify
  send({ type: 'step', step: 'identify', message: 'Определяем матч...' })
  const context = await classifyQuery(query)

  if (context.isTeam && context.teamName) {
    send({ type: 'match_found', teamName: context.teamName, sport: context.sport ?? 'football' })
  }

  // Step 2: Collect
  send({ type: 'step', step: 'collect', message: 'Собираем статистику...' })

  let stats: string
  let claudeContext: string

  if (context.isTeam && context.teamName) {
    const match = await findNextMatch(context.teamName, context.sport)
    send({ type: 'step', step: 'collect', message: `${match.teamA} vs ${match.teamB} — собираем данные...` })
    stats = await fetchMatchStats(match)
    claudeContext = `Матч: ${match.teamA} vs ${match.teamB}, ${match.date}, ${match.league}. Арена: ${match.venue}, время: ${match.time}. Анализируй именно этот матч.`
  } else {
    stats = await fetchMatchData(query, false)
    claudeContext = `Пользователь запросил анализ матча: "${query}".`
  }

  // Step 3: Parse into MatchData via Claude
  send({ type: 'step', step: 'analyze', message: 'Структурируем данные...' })
  const matchData = await parseMatchDataWithClaude(stats, claudeContext)

  return { rawStats: stats, matchData }
}

// ══════════════════════════════════════════════════
// Claude calls
// ══════════════════════════════════════════════════

async function parseMatchDataWithClaude(stats: string, claudeContext: string): Promise<MatchData | null> {
  const matchDataPrompt = `Ты — профессиональный аналитик для беттинга. ${claudeContext}

ВАЖНО: Анализируй ОБЯЗАТЕЛЬНО ОБЕ команды равноценно. Форма, голы, травмы — для каждой команды отдельно. Не игнорируй ни одну из сторон.

⚠️ ДАННЫЕ МОГУТ БЫТЬ НЕТОЧНЫМИ (источник: поиск по интернету). Пометка для отчёта.

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
    "home": { "last5": ["W","D","L","W","W"], "streak": "2W", "homeRecord": ["W","W","D","W","L"] },
    "away": { "last5": ["L","W","W","D","L"], "streak": "1L", "awayRecord": ["L","W","D","L","W"] }
  },
  "h2h": {
    "homeWins": 7, "awayWins": 3, "draws": 2,
    "recentGames": [{"date": "15 окт 2025", "score": "2:1", "competition": "РПЛ"}]
  },
  "stats": {
    "home": { "goalsScored": 1.6, "goalsConceded": 0.8, "xG": 1.5, "xGA": 0.9, "shotsOnTarget": 4.2, "possession": 55, "corners": 5.4, "yellowCards": 1.8, "cleanSheets": 3, "bttsPct": 55, "over25Pct": 60 },
    "away": { "goalsScored": 1.2, "goalsConceded": 1.4, "xG": 1.1, "xGA": 1.3, "shotsOnTarget": 3.5, "possession": 48, "corners": 4.1, "yellowCards": 2.2, "cleanSheets": 1, "bttsPct": 65, "over25Pct": 70 }
  },
  "injuries": {
    "home": [{"name": "Игрок", "role": "Нападающий", "reason": "injury", "details": "травма колена", "impact": "key"}],
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
      {"name": "Фонбет", "values": {"П1": 1.85, "X": 3.40, "П2": 4.20}}
    ]
  }
}

СТРОГИЕ ПРАВИЛА:
- homeTeam и awayTeam — ПОЛНЫЕ названия.
- form.home.last5 и form.away.last5 — ОБЯЗАТЕЛЬНО по 5 результатов.
- stats — средние за последние 5-10 матчей. xG/xGA — null если нет данных.
- injuries — пустой массив если нет.
- odds.bookmakers — минимум 1 букмекер.
- motivation — ОБЯЗАТЕЛЬНО для обеих команд.
- sport: "football", "hockey", "basketball" или "tennis".`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: matchDataPrompt }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(jsonText) as MatchData
  } catch (err) {
    console.error('[analyze] matchData parse error:', err)
    return null
  }
}

async function runClaudeAnalysis(matchData: MatchData | null): Promise<AnalysisReport | null> {
  if (!matchData) return null

  const analysisPrompt = `Ты — профессиональный аналитик для беттинга.

Структурированные данные матча:
${JSON.stringify(matchData)}

На основе этих данных сгенерируй аналитический отчёт. ВСЕГДА давай прогноз на основе имеющихся данных. Никогда не отказывайся.

Верни ТОЛЬКО валидный JSON (без markdown, без объяснений):
{
  "sections": {
    "formAnalysis": "2-3 предложения: оценка формы обеих команд + H2H. Конкретные факты.",
    "statsAnalysis": "2-3 предложения: сравнение ключевых метрик. Цифры обязательны.",
    "injuriesAnalysis": "1-2 предложения: влияние потерь на расклад.",
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
    "summary": "1-2 предложения: главный вывод, чёткий прогноз с цифрами.",
    "confidence": "high/medium/low",
    "bets": [
      {"market": "П1", "reasoning": "Почему этот рынок.", "confidence": "high/medium/low", "value": "underpriced/fair/overpriced"}
    ]
  }
}

ПРАВИЛА:
- Текст на русском, с конкретными цифрами и фактами.
- odds.average — средние коэффициенты из данных букмекеров.
- recommendation.bets — от 1 до 3 рынков.
- recommendation.summary — СРАВНИТЕЛЬНАЯ аналитика ОБЕИХ команд. Максимум 80-100 слов.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(jsonText) as AnalysisReport
  } catch (err) {
    console.error('[analyze] analysis parse error:', err)
    return null
  }
}

// ══════════════════════════════════════════════════
// Perplexity context enrichment (Step 4 of Sports API pipeline)
// ══════════════════════════════════════════════════

async function fetchContextFromPerplexity(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  date: string,
  venue?: string,
): Promise<MatchData['contextFactors']> {
  const OpenAI = (await import('openai')).default
  const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: 'https://api.perplexity.ai',
  })

  const today = new Date().toISOString().split('T')[0]

  try {
    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `Сегодня ${today}. Отвечай строго JSON без лишнего текста.`,
        },
        {
          role: 'user',
          content: `Матч: ${homeTeam} vs ${awayTeam}, ${competition}, ${date}.

Ответь JSON:
{
  "weather": {"temp": 5, "condition": "облачно"},
  "restDays": {"home": 3, "away": 4},
  "referee": {"name": "Иванов", "avgYellowCards": 4.0, "penaltiesPerGame": 0.2},
  "recentTransfers": ["Игрок X перешёл в команду A"],
  "motivation": {
    "home": {"level": "high/medium/low", "reason": "причина"},
    "away": {"level": "high/medium/low", "reason": "причина"}
  }
}

Правила:
- weather: null если крытый стадион${venue ? ` (${venue})` : ''}
- referee: null если не найден
- recentTransfers: пустой массив если нет
- restDays: сколько дней отдыха с предыдущего матча
- Если не нашёл данные — ставь null / пустой массив, не выдумывай`,
        },
      ],
    })

    const text = (response.choices[0].message.content ?? '').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { restDays: { home: 0, away: 0 } }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      weather: parsed.weather ?? undefined,
      restDays: parsed.restDays ?? { home: 0, away: 0 },
      referee: parsed.referee ?? undefined,
      recentTransfers: parsed.recentTransfers ?? [],
    }
  } catch (err) {
    console.error('[analyze] Perplexity context error:', err)
    return { restDays: { home: 0, away: 0 } }
  }
}
