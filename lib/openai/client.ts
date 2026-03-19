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
}

/**
 * Классифицирует запрос: команда или конкретный матч.
 * НЕ ищет расписание — только определяет тип.
 */
export async function classifyQuery(query: string): Promise<QueryContext> {
  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: 'Определи спортивный запрос. Отвечай строго JSON без лишнего текста.',
      },
      {
        role: 'user',
        content: `Запрос: "${query}"

Это название команды или конкретный матч (две команды)?
Верни JSON:
{
  "isTeam": true/false,
  "sport": "футбол"/"хоккей"/"баскетбол"/null,
  "teamName": "название команды или null"
}`,
      },
    ],
  })

  try {
    const text = (response.choices[0].message.content ?? '').trim()
    console.log('[classifyQuery] raw:', text)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])
    console.log('[classifyQuery] parsed:', JSON.stringify(parsed))
    return {
      isTeam: parsed.isTeam ?? false,
      sport: parsed.sport ?? null,
      teamName: parsed.teamName ?? null,
      matchQuery: query,
    }
  } catch (e) {
    console.error('[classifyQuery] parse error:', e)
    return { isTeam: false, sport: null, teamName: null, matchQuery: query }
  }
}

/**
 * Ищет ближайший матч + статистику через Perplexity в одном запросе.
 */
export async function fetchMatchData(teamOrMatch: string, isTeam: boolean): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const prompt = isTeam
    ? `Команда: ${teamOrMatch}. Сегодня ${today}.

1. Найди ближайший матч ${teamOrMatch} (${today} или позже). Соперник, дата, время, арена, турнир.

2. Последние 5 матчей ${teamOrMatch} — дата, соперник, счёт.

3. Последние 5 матчей СОПЕРНИКА — дата, соперник, счёт.

4. Личные встречи между ними (последние 3-5).

5. Травмы/дисквалификации обеих команд.

6. Коэффициенты букмекеров на этот матч (если есть).

Русский язык, кратко, по делу.`
    : `Матч: ${teamOrMatch}. Сегодня ${today}.

1. Последние 5 матчей КАЖДОЙ команды — дата, соперник, счёт.

2. Личные встречи (последние 3-5).

3. Травмы/дисквалификации обеих команд.

4. Коэффициенты букмекеров (если есть).

Русский язык, кратко, по делу.`

  const response = await perplexity.chat.completions.create({
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты спортивный аналитик. Ищи данные в интернете максимально тщательно. Всегда возвращай результат — даже если нашёл не всё, отдай то что есть. Не отказывайся.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const result = response.choices[0].message.content ?? ''
  console.log('[fetchMatchData] length:', result.length, 'preview:', result.slice(0, 300))
  return result
}
