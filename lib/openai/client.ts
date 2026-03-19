import OpenAI from 'openai'

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
})

export interface QueryContext {
  isTeam: boolean
  sport: string | null
  teamName: string | null
  matchQuery: string
  nextMatchInfo: string | null
}

/**
 * Определяет: запрос — это команда или конкретный матч.
 * Если команда — находит её следующий матч через Perplexity.
 */
export async function resolveQuery(query: string): Promise<QueryContext> {
  const today = new Date().toISOString().split('T')[0]

  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты помогаешь определить спортивный запрос и найти актуальный матч. Отвечай строго JSON без лишнего текста.`,
      },
      {
        role: 'user',
        content: `Запрос: "${query}"

1. Это название команды или конкретный матч?
2. Если команда — найди её СЛЕДУЮЩИЙ матч, который ещё не сыгран (дата строго после ${today}).
3. Верни JSON:
{
  "isTeam": true/false,
  "sport": "футбол"/"хоккей"/"баскетбол"/null,
  "teamName": "название"/null,
  "matchQuery": "Команда1 vs Команда2, дата, турнир",
  "nextMatchInfo": "краткое описание"/null
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
 * Собирает актуальную статистику через Perplexity.
 */
export async function fetchMatchStats(matchQuery: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты спортивный аналитик. Давай актуальные данные на основе последних новостей.`,
      },
      {
        role: 'user',
        content: `Найди актуальную статистику для ставок: ${matchQuery}.
Нужно: форма команд за последние 5-10 матчей, личные встречи, травмы и дисквалификации, ключевые игроки, коэффициенты букмекеров.
Отвечай на русском, кратко и по делу.`,
      },
    ],
  })

  return response.choices[0].message.content ?? ''
}
