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
  const response = await openai.responses.create({
    model: 'gpt-4o-mini-search-preview',
    tools: [{ type: 'web_search_preview' }],
    input: `Проанализируй запрос пользователя: "${query}"

Определи:
1. Это название команды (без конкретного матча) или конкретный матч/событие?
2. Если команда — какой вид спорта? Найди её ближайший предстоящий матч (дата, соперник, турнир).
3. Если уже конкретный матч — просто подтверди.

Ответь строго в JSON формате:
{
  "isTeam": true/false,
  "sport": "футбол" / "хоккей" / "баскетбол" / null,
  "teamName": "название команды" / null,
  "matchQuery": "итоговый запрос для анализа конкретного матча",
  "nextMatchInfo": "краткая инфо о найденном матче" / null
}

Только JSON, без лишнего текста.`,
  })

  try {
    const text = response.output_text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0]) as QueryContext
  } catch {
    // Fallback: считаем что это уже конкретный матч
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
  const response = await openai.responses.create({
    model: 'gpt-4o-mini-search-preview',
    tools: [{ type: 'web_search_preview' }],
    input: `Найди актуальную статистику и последние новости для ставок: ${matchQuery}.
Нужно: текущая форма команд, личные встречи, травмы/дисквалификации, аналитика букмекеров, коэффициенты.
Отвечай на русском языке, кратко и по делу.`,
  })

  return response.output_text
}
