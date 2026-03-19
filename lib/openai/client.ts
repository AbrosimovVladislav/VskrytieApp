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

ЗАДАЧА 1 (ГЛАВНАЯ): Найди ближайший предстоящий матч этой команды. Дата должна быть строго после ${today}. Нужен САМЫЙ БЛИЖАЙШИЙ матч — не важный, не плей-офф, а именно следующий по календарю. Укажи: соперник, точная дата, время, место проведения, турнир.

ЗАДАЧА 2: Дай статистику для ставок на этот матч:
- Форма обеих команд за последние 5-10 матчей
- Личные встречи между ними
- Травмы и дисквалификации
- Ключевые игроки
- Коэффициенты букмекеров (если есть)

Отвечай на русском, кратко и по делу.`
    : `Матч: ${teamOrMatch}. Сегодня ${today}.

Найди актуальную статистику для ставок на этот матч:
- Форма команд за последние 5-10 матчей
- Личные встречи
- Травмы и дисквалификации
- Ключевые игроки
- Коэффициенты букмекеров (если есть)

Отвечай на русском, кратко и по делу.`

  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты спортивный аналитик. Давай актуальные данные на основе последних новостей и официальных календарей.`,
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
