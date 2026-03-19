import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveQuery, fetchMatchStats } from '@/lib/openai/client'
import { createServiceClient } from '@/lib/supabase/server'
import { validateTelegramInitData } from '@/lib/telegram/validate'

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
          } catch (e) {
            send({ type: 'error', message: `Невалидный initData: ${e instanceof Error ? e.message : e}` })
            controller.close()
            return
          }
        }

        // Step 1: Определяем запрос (команда или матч?)
        send({ type: 'step', step: 1, message: 'Определяем запрос...' })
        const context = await resolveQuery(query)

        // Если нашли команду и следующий матч — сообщаем клиенту
        if (context.isTeam && context.nextMatchInfo) {
          send({
            type: 'match_found',
            teamName: context.teamName,
            sport: context.sport,
            nextMatchInfo: context.nextMatchInfo,
            matchQuery: context.matchQuery,
          })
        }

        // Step 2: Create report
        send({ type: 'step', step: 2, message: 'Создаём отчёт...' })
        const db = createServiceClient()

        if (telegramUserId) {
          await db.from('users').upsert(
            { telegram_user_id: telegramUserId, first_name: 'User', updated_at: new Date().toISOString() },
            { onConflict: 'telegram_user_id', ignoreDuplicates: false }
          )
        }

        const { data: report, error: reportError } = await db
          .from('reports')
          .insert({ query: context.matchQuery, telegram_user_id: telegramUserId ?? 0, status: 'processing' })
          .select('id')
          .single()

        if (reportError || !report) {
          send({ type: 'error', message: `Ошибка создания отчёта: ${reportError?.message ?? 'нет данных'}` })
          controller.close()
          return
        }

        send({ type: 'id', id: report.id })

        // Step 3: Web search stats
        send({ type: 'step', step: 3, message: 'Ищем статистику...' })
        const stats = await fetchMatchStats(context.matchQuery)

        // Step 4: Claude analysis
        send({ type: 'step', step: 4, message: 'Генерируем аналитику...' })

        const systemContext = context.isTeam
          ? `Пользователь искал команду "${context.teamName}" (${context.sport}). Был найден её следующий матч: ${context.nextMatchInfo}. Анализируй именно этот предстоящий матч.`
          : `Пользователь запросил анализ: "${query}".`

        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
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

        // Step 5: Save
        send({ type: 'step', step: 5, message: 'Сохраняем...' })
        await db.from('reports').update({ raw_stats: stats, summary: fullSummary, status: 'done' }).eq('id', report.id)

        send({ type: 'done', id: report.id })
      } catch (err) {
        const message = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err)
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
