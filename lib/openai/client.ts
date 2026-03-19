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

export interface MatchInfo {
  teamA: string
  teamB: string
  date: string
  time: string
  venue: string
  league: string
}

/**
 * Классифицирует запрос: команда или конкретный матч.
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
 * Шаг 1: Два параллельных sonar-запроса ищут ближайший матч.
 * Сравниваем ответы для верификации.
 */
export async function findNextMatch(team: string, sport: string | null): Promise<MatchInfo> {
  const today = new Date().toISOString().split('T')[0]
  const sportCtx = sport ? ` (${sport})` : ''

  // Два разных промпта для перекрёстной проверки
  const [res1, res2] = await Promise.all([
    perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `Сегодня ${today}. Найди ближайший матч по официальному расписанию. Отвечай строго JSON.`,
        },
        {
          role: 'user',
          content: `Какой ближайший матч у команды "${team}"${sportCtx}? Дата ${today} или позже.
Ищи в расписании лиги, на flashscore, sports.ru, championat.com.
Верни JSON:
{"teamA": "хозяева", "teamB": "гости", "date": "ДД.ММ.ГГГГ", "time": "ЧЧ:ММ", "venue": "арена", "league": "лига"}`,
        },
      ],
    }),
    perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `Сегодня ${today}. Ты спортивный журналист. Отвечай строго JSON.`,
        },
        {
          role: 'user',
          content: `Расписание "${team}"${sportCtx}: следующий матч после ${today}?
Верни JSON:
{"teamA": "хозяева", "teamB": "гости", "date": "ДД.ММ.ГГГГ", "time": "ЧЧ:ММ", "venue": "арена", "league": "лига"}`,
        },
      ],
    }),
  ])

  const parse = (text: string): MatchInfo | null => {
    try {
      const m = text.match(/\{[\s\S]*\}/)
      if (!m) return null
      return JSON.parse(m[0]) as MatchInfo
    } catch { return null }
  }

  const m1 = parse(res1.choices[0].message.content ?? '')
  const m2 = parse(res2.choices[0].message.content ?? '')

  console.log('[findNextMatch] result1:', JSON.stringify(m1))
  console.log('[findNextMatch] result2:', JSON.stringify(m2))

  // Если оба нашли одного соперника — высокая уверенность
  if (m1 && m2) {
    const normalize = (s: string) => s.toLowerCase().replace(/[хx]к\s*/gi, '').replace(/\s+/g, ' ').trim()
    const match1opponent = normalize(m1.teamA) === normalize(team) ? m1.teamB : m1.teamA
    const match2opponent = normalize(m2.teamA) === normalize(team) ? m2.teamB : m2.teamA

    if (normalize(match1opponent) === normalize(match2opponent)) {
      console.log('[findNextMatch] VERIFIED: both agree on opponent:', match1opponent)
      return m1
    }
    console.log('[findNextMatch] MISMATCH:', match1opponent, 'vs', match2opponent, '— using first')
  }

  // Возвращаем что есть
  return m1 ?? m2 ?? { teamA: team, teamB: 'Неизвестен', date: today, time: '', venue: '', league: '' }
}

/**
 * Шаг 2: Детальная статистика обеих команд через sonar-pro.
 */
export async function fetchMatchStats(match: MatchInfo): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const response = await perplexity.chat.completions.create({
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: `Сегодня ${today}. Ты спортивный аналитик. Ищи реальные результаты матчей с датами и счетами. Всегда возвращай данные по обеим командам.`,
      },
      {
        role: 'user',
        content: `Матч: ${match.teamA} vs ${match.teamB}, ${match.date}, ${match.league}.

Дай статистику для прогноза:

1. Последние 5 матчей ${match.teamA} — дата, соперник, счёт (кто выиграл).
2. Последние 5 матчей ${match.teamB} — дата, соперник, счёт (кто выиграл).
3. Личные встречи ${match.teamA} vs ${match.teamB} (последние 3-5) — дата, счёт.
4. Травмы/дисквалификации обеих команд.
5. Коэффициенты букмекеров на этот матч.

Русский язык, кратко, по делу. Для каждого матча ОБЯЗАТЕЛЬНО укажи дату и счёт.`,
      },
    ],
  })

  const result = response.choices[0].message.content ?? ''
  console.log('[fetchMatchStats] length:', result.length, 'preview:', result.slice(0, 300))
  return result
}

/**
 * Legacy: для обратной совместимости с route.ts (матч уже известен)
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
