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
        content: `Сегодняшняя дата: ${new Date().toLocaleDateString('ru-RU')}. Запрос пользователя: "${query}"

Шаг 1: Определи — это название команды или конкретный матч?
Шаг 2: Если это команда — ОБЯЗАТЕЛЬНО найди через поиск в интернете её ближайший предстоящий матч (дата, соперник, турнир). Без поиска в сети ответ недопустим.
Шаг 3: Верни JSON.

Формат ответа (только JSON, без лишнего текста):
{
  "isTeam": true/false,
  "sport": "футбол" / "хоккей" / "баскетбол" / null,
  "teamName": "название команды" / null,
  "matchQuery": "Команда1 vs Команда2, дата, турнир — ОБЯЗАТЕЛЬНО, никогда не null",
  "nextMatchInfo": "краткая инфо о найденном матче, например: vs Авангард, 21 марта, КХЛ" / null
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
