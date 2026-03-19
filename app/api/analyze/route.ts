import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fetchMatchStats } from '@/lib/openai/client'
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
          } catch {
            send({ type: 'error', message: 'Невалидный initData' })
            controller.close()
            return
          }
        }

        const db = createServiceClient()

        // Upsert user if we have telegram ID
        if (telegramUserId) {
          await db.from('users').upsert(
            {
              telegram_user_id: telegramUserId,
              first_name: 'User',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'telegram_user_id', ignoreDuplicates: false }
          )
        }

        // Create report row
        const { data: report, error: reportError } = await db
          .from('reports')
          .insert({
            query: query.trim(),
            telegram_user_id: telegramUserId ?? 0,
            status: 'processing',
          })
          .select('id')
          .single()

        if (reportError || !report) {
          send({ type: 'error', message: 'Ошибка создания отчёта' })
          controller.close()
          return
        }

        send({ type: 'id', id: report.id })

        // Step 1: ChatGPT web search
        send({ type: 'status', message: 'Ищем статистику...' })
        const stats = await fetchMatchStats(query)
        send({ type: 'stats', content: stats })

        // Step 2: Claude analysis streaming
        send({ type: 'status', message: 'Анализируем данные...' })

        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `Ты — профессиональный аналитик для беттинга. Проанализируй запрос и дай структурированный отчёт.

Запрос: ${query}

Статистика из интернета:
${stats}

Дай отчёт в формате:
## Общая картина
[2-3 предложения о матче/команде]

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
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullSummary += event.delta.text
            send({ type: 'chunk', content: event.delta.text })
          }
        }

        // Save completed report
        await db.from('reports').update({
          raw_stats: stats,
          summary: fullSummary,
          status: 'done',
        }).eq('id', report.id)

        send({ type: 'done', id: report.id })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
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
