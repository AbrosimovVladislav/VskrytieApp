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
2. Если команда — найди БЛИЖАЙШИЙ по дате матч, который ещё НЕ сыгран. Дата матча должна быть строго после ${today}. Ищи именно самый ближайший, а не какой-нибудь важный или плей-офф.
3. Верни JSON. matchQuery НИКОГДА не null и не пустой.
{
  "isTeam": true/false,
  "sport": "футбол"/"хоккей"/"баскетбол"/null,
  "teamName": "название команды или null",
  "matchQuery": "Команда1 vs Команда2, дата, турнир (или просто название команды если не нашёл)",
  "nextMatchInfo": "Краткое: соперник, дата, время, место (или null если не нашёл)"
}`,
      },
    ],
  })

  try {
    const text = (response.choices[0].message.content ?? '').trim()
    console.log('[resolveQuery] raw response:', text)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0]) as QueryContext
    console.log('[resolveQuery] parsed:', JSON.stringify(parsed))
    return parsed
  } catch (e) {
    console.error('[resolveQuery] parse error:', e)
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
export async function fetchMatchStats(matchQuery: string, needNextMatch: boolean = false): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const nextMatchInstruction = needNextMatch
    ? `\nСНАЧАЛА найди самый ближайший по дате предстоящий матч этой команды после ${today} (не плей-офф если есть регулярка). Укажи: соперник, точная дата, время, место. Это главный приоритет.\n`
    : ''

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
${nextMatchInstruction}Нужно: форма команд за последние 5-10 матчей, личные встречи, травмы и дисквалификации, ключевые игроки, коэффициенты букмекеров.
Отвечай на русском, кратко и по делу.`,
      },
    ],
  })

  const result = response.choices[0].message.content ?? ''
  console.log('[fetchMatchStats] response length:', result.length, 'preview:', result.slice(0, 200))
  return result
}
