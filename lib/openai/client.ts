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

ЗАДАЧА 1 (ГЛАВНАЯ): Найди ближайший предстоящий матч этой команды по ОФИЦИАЛЬНОМУ календарю/расписанию лиги. Дата — ${today} или позже. Укажи ТОЧНО: соперник, дата, время, стадион/арена, турнир. Если не можешь найти реальный матч в расписании — СКАЖИ ОБ ЭТОМ ПРЯМО, не выдумывай.

ЗАДАЧА 2: Статистика для ОБЕих команд (!!!) — и ${teamOrMatch}, и соперника:
- Форма КАЖДОЙ команды: последние 5 матчей (результаты W/D/L с датами и счетами)
- Голы забитые и пропущенные КАЖДОЙ команды за 5 матчей
- Личные встречи между ними (последние 3-5)
- Травмы/дисквалификации ОБЕИХ команд
- Коэффициенты букмекеров (если есть)

ВАЖНО: Нужна статистика ОБЕих команд, не только ${teamOrMatch}. Русский язык, кратко.`
    : `Матч: ${teamOrMatch}. Сегодня ${today}.

Найди статистику для ОБЕих команд этого матча:
- Форма КАЖДОЙ команды: последние 5 матчей (W/D/L с датами и счетами)
- Голы забитые и пропущенные КАЖДОЙ команды за 5 матчей
- Личные встречи (последние 3-5)
- Травмы/дисквалификации ОБЕИХ команд
- Коэффициенты букмекеров (если есть)

ВАЖНО: Данные нужны по ОБЕИМ командам равноценно. Русский язык, кратко.`

  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты спортивный аналитик. Используй ТОЛЬКО реальные данные из официальных источников (сайты лиг, flashscore, sports.ru, championat.com). НЕ ВЫДУМЫВАЙ матчи, даты или результаты. Если не можешь найти данные — скажи об этом честно.`,
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
