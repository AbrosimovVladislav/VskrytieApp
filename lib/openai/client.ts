import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface QueryContext {
  isTeam: boolean
  sport: string | null
  teamName: string | null
  matchQuery: string // финальный запрос для анализа (конкретный матч)
  nextMatchInfo: string | null // найденная инфа о следующем матче
}

/**
 * Определяет: запрос — это команда или конкретный матч.
 * Если команда — находит её следующий матч и возвращает как matchQuery.
 */
export async function resolveQuery(query: string): Promise<QueryContext> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-search-preview',
    messages: [
      {
        role: 'user',
        content: `Сегодня: ${new Date().toISOString().split('T')[0]}. Запрос: "${query}"

Задача:
1. Это команда или конкретный матч?
2. Если команда — найди через поиск её СЛЕДУЮЩИЙ матч, который ЕЩЁ НЕ СЫГРАН (дата строго после ${new Date().toISOString().split('T')[0]}). Матчи до этой даты не подходят.
3. Верни JSON.

Только JSON:
{
  "isTeam": true/false,
  "sport": "футбол"/"хоккей"/"баскетбол"/null,
  "teamName": "название"/null,
  "matchQuery": "Команда1 vs Команда2, дата, турнир",
  "nextMatchInfo": "краткое описание матча"/null
}`,
      },
    ],
  })

  try {
    const text = (response.choices[0].message.content ?? '').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0]) as QueryContext
  } catch {
    return {
      isTeam: false,
      sport: null,
      teamName: null,
      matchQuery: query,
      nextMatchInfo: null,
    }
  }
}

/**
 * Ищет актуальную статистику для конкретного матча.
 */
export async function fetchMatchStats(matchQuery: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-search-preview',
    messages: [
      {
        role: 'user',
        content: `Дай подробную аналитику для ставок по матчу: ${matchQuery}.
Нужно: текущая форма команд, личные встречи, травмы/дисквалификации, ключевые игроки, аналитика.
Отвечай на русском языке, кратко и по делу.`,
      },
    ],
    max_tokens: 1000,
  })

  return response.choices[0].message.content ?? ''
}
