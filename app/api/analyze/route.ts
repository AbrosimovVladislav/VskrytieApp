import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { classifyQuery, fetchMatchData } from '@/lib/openai/client'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'
import { MatchReport } from '@/lib/types/report'

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

        // Step 1: classify query
        send({ type: 'step', step: 1, message: 'Определяем запрос...' })
        console.log('[analyze] step 1: classifyQuery')
        const context = await classifyQuery(query)
        console.log('[analyze] context:', JSON.stringify(context))

        if (context.isTeam && context.teamName) {
          send({
            type: 'match_found',
            teamName: context.teamName,
            sport: context.sport,
          })
        }

        // Step 2: create report in supabase
        send({ type: 'step', step: 2, message: 'Создаём отчёт...' })
        console.log('[analyze] step 2: create report')
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

        // Step 3: fetch match data + stats from Perplexity (single call)
        send({ type: 'step', step: 3, message: 'Ищем матч и статистику...' })
        console.log('[analyze] step 3: fetchMatchData, isTeam:', context.isTeam)
        const stats = await fetchMatchData(query, context.isTeam)
        console.log('[analyze] stats length:', stats.length)

        const claudeContext = context.isTeam
          ? `Пользователь ввёл название команды "${context.teamName}" (${context.sport}). Perplexity нашёл ближайший матч и статистику — всё ниже. Анализируй именно найденный ближайший матч.`
          : `Пользователь запросил анализ матча: "${query}".`

        // Step 4: Claude structured JSON call (non-streaming)
        send({ type: 'step', step: 4, message: 'Структурируем данные...' })
        console.log('[analyze] step 4: claude structured JSON')

        const structuredPrompt = `Ты — профессиональный аналитик для беттинга. ${claudeContext}

ВАЖНО: Анализируй ОБЯЗАТЕЛЬНО ОБЕ команды равноценно. Форма, голы, травмы — для каждой команды отдельно. Не игнорируй ни одну из сторон.

Данные из Perplexity (поиск по интернету):
${stats}

Верни ТОЛЬКО валидный JSON в следующем формате (без markdown, без объяснений):
{
  "header": {
    "league": "название лиги",
    "date": "дата матча",
    "homeTeam": "полное название хозяев",
    "awayTeam": "полное название гостей",
    "stadium": "стадион (если известен)",
    "time": "время матча (если известно)"
  },
  "form": {
    "home": ["W","D","L","W","W"],
    "away": ["L","W","W","D","L"],
    "homeAtHome": ["W","W","W","W","W"],
    "awayAway": ["L","W","D","L","W"]
  },
  "stats": [
    {"label": "Голов забито (5 матчей)", "homeValue": 8, "awayValue": 6},
    {"label": "Голов пропущено (5 матчей)", "homeValue": 3, "awayValue": 5},
    {"label": "Средний xG", "homeValue": 1.8, "awayValue": 1.4, "unit": "xG"}
  ],
  "injuries": {
    "homeOk": true,
    "awayOk": false,
    "home": [],
    "away": [
      {"name": "Промес", "position": "Нападающий", "reason": "травма", "duration": "сезон"}
    ]
  },
  "h2h": {
    "homeWins": 7,
    "awayWins": 3,
    "draws": 2,
    "matches": [
      {"date": "15 окт 25", "homeTeam": "ЦСКА", "score": "2:1", "awayTeam": "Спартак"}
    ],
    "homeGroundRecord": "4П 0Н 1П"
  },
  "odds": {
    "bookmakers": [
      {"name": "Фонбет", "home": 1.85, "draw": 3.40, "away": 4.20}
    ]
  }
}

ПРАВИЛА:
- homeTeam и awayTeam — ПОЛНЫЕ названия команд (не обрезай).
- stats ОБЯЗАН содержать данные ОБЕих команд (homeValue и awayValue). 3-4 позиции.
- form ОБЯЗАН содержать результаты ОБЕих команд за последние 5 матчей.
- Если данных нет — используй разумные значения на основе контекста или пустые массивы.`

        let structuredReport: MatchReport | null = null

        try {
          const structuredResponse = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            messages: [
              {
                role: 'user',
                content: structuredPrompt,
              },
            ],
          })

          const rawText = structuredResponse.content
            .filter((block) => block.type === 'text')
            .map((block) => (block as { type: 'text'; text: string }).text)
            .join('')

          console.log('[analyze] structured raw length:', rawText.length)

          // Strip possible markdown code fences before parsing
          const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

          structuredReport = JSON.parse(jsonText) as MatchReport

          // Emit section events
          const sections: (keyof MatchReport)[] = ['header', 'form', 'stats', 'injuries', 'h2h', 'odds']
          for (const section of sections) {
            if (structuredReport[section] !== undefined) {
              send({ type: 'section', section, data: structuredReport[section] })
            }
          }
        } catch (parseErr) {
          console.error('[analyze] structured JSON parse error:', parseErr)
          send({ type: 'error', message: 'Ошибка разбора данных' })
          // Continue — we can still do the recommendation stream without structured data
        }

        // Step 5: Claude recommendation (streaming)
        send({ type: 'step', step: 5, message: 'Генерируем рекомендацию...' })
        console.log('[analyze] step 5: claude recommendation stream')

        const recommendationPrompt = `Ты — профессиональный аналитик для беттинга. ${claudeContext}

Структурированный анализ:
${JSON.stringify(structuredReport)}

Дай СРАВНИТЕЛЬНУЮ аналитику ОБЕИХ команд. Максимум 80-100 слов. Формат:
- Больше конкретных фактов и цифр, меньше воды.
- Сравни форму, статистику, очные встречи обеих команд.
- Закончи одним чётким выводом (прогноз/ставка).
Без списков, связный текст. Русский язык.`

        const claudeStream = anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: recommendationPrompt,
            },
          ],
        })

        let fullRecommendation = ''
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullRecommendation += event.delta.text
            send({ type: 'chunk', content: event.delta.text })
          }
        }
        console.log('[analyze] recommendation done, length:', fullRecommendation.length)

        // Step 6: save
        send({ type: 'step', step: 6, message: 'Сохраняем...' })
        console.log('[analyze] step 6: save to supabase')
        await db
          .from('reports')
          .update({
            raw_stats: stats,
            summary: fullRecommendation,
            structured_report: JSON.parse(JSON.stringify(structuredReport)),
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
