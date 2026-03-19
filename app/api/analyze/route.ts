import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveQuery, fetchMatchStats } from '@/lib/openai/client'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'

export const maxDuration = 60

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

        // Step 1
        send({ type: 'step', step: 1, message: 'Определяем запрос...' })
        console.log('[analyze] step 1: resolveQuery')
        const context = await resolveQuery(query)
        console.log('[analyze] context:', JSON.stringify(context))

        // Fallback: если matchQuery не заполнен — используем оригинальный запрос
        if (!context.matchQuery) context.matchQuery = query

        if (context.isTeam && context.nextMatchInfo) {
          send({
            type: 'match_found',
            teamName: context.teamName,
            sport: context.sport,
            nextMatchInfo: context.nextMatchInfo,
            matchQuery: context.matchQuery,
          })
        }

        // Step 2
        send({ type: 'step', step: 2, message: 'Создаём отчёт...' })
        console.log('[analyze] step 2: create report in supabase')
        const db = createServiceClient()

        if (telegramUserId) {
          await db.from('users').upsert(
            { telegram_user_id: telegramUserId, first_name: 'User', updated_at: new Date().toISOString() },
            { onConflict: 'telegram_user_id', ignoreDuplicates: false }
          )
        }

        const { data: report, error: reportError } = await db
          .from('reports')
          .insert({ query: context.matchQuery, telegram_user_id: telegramUserId ?? null, status: 'pending' })
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

        // Step 3
        send({ type: 'step', step: 3, message: 'Ищем статистику...' })
        console.log('[analyze] step 3: fetchMatchStats for:', context.matchQuery)
        const stats = await fetchMatchStats(context.matchQuery)
        console.log('[analyze] stats length:', stats.length)

        // Step 4
        send({ type: 'step', step: 4, message: 'Генерируем аналитику...' })
        console.log('[analyze] step 4: claude stream')

        const systemContext = context.isTeam
          ? `Пользователь искал команду "${context.teamName}" (${context.sport}). Был найден её следующий матч: ${context.nextMatchInfo}. Анализируй именно этот предстоящий матч.`
          : `Пользователь запросил анализ: "${query}".`

        const claudeStream = anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `Ты — профессиональный аналитик для беттинга. ${systemContext}

Статистика из интернета:
${stats}

Дай отчёт в формате:
## Общая картина
[2-3 предложения о матче]

## Ключевые факторы
- [фактор 1]
- [фактор 2]
- [фактор 3]

## Статистика
[основные числа]

## Рекомендации
[конкретные советы по ставкам]

## Риски
[что может пойти не так]

Пиши кратко, конкретно, без воды. Русский язык.`,
            },
          ],
        })

        let fullSummary = ''
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullSummary += event.delta.text
            send({ type: 'chunk', content: event.delta.text })
          }
        }
        console.log('[analyze] claude done, summary length:', fullSummary.length)

        // Step 5
        send({ type: 'step', step: 5, message: 'Сохраняем...' })
        console.log('[analyze] step 5: save to supabase')
        await db.from('reports').update({ raw_stats: stats, summary: fullSummary, status: 'completed' }).eq('id', report.id)

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
