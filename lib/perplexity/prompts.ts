// ── Step 1: Match identification (multi-agent) ──

const JSON_TEMPLATE = `{
  "sport": "SPORT",
  "homeTeam": "полное официальное название",
  "awayTeam": "полное официальное название",
  "competition": "название лиги/турнира",
  "round": "стадия: Тур 28 / Плей-офф 1/4 финала, 1-й матч / Финал и т.д.",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "venue": "название арены/стадиона"
}`

/**
 * Agent 1: Direct match search — straightforward query
 */
export function identifyMatchDirectPrompt(query: string, sport: string): string {
  const today = new Date().toISOString().split('T')[0]

  return `Ты — спортивный аналитик. Сегодня ${today}.

Запрос пользователя: "${query}"
Вид спорта: ${sport}

Найди ближайший ПРЕДСТОЯЩИЙ матч по этому запросу. Определи ТОЧНО:
- Полные официальные названия ОБЕИХ команд (никогда не пиши "TBD" или "неизвестно")
- Какой это турнир и КАКАЯ СТАДИЯ (регулярный сезон, плей-офф 1/8, 1/4, 1/2, финал и т.д.)
- Дату, время и место проведения

Если пара плей-офф уже определена — обе команды ИЗВЕСТНЫ, найди их.
Если не можешь найти точный матч — найди ближайший матч этой команды.

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json):
${JSON_TEMPLATE.replace('SPORT', sport)}

ВАЖНО:
- ОБЯЗАТЕЛЬНО укажи обе команды по имени. Никогда "TBD", "—", "неизвестно"
- Определи стадию турнира ТОЧНО (плей-офф ≠ регулярный сезон)
- ТОЛЬКО JSON, никакого текста вокруг`
}

/**
 * Agent 2: Schedule/calendar search — looks at upcoming schedule
 */
export function identifyMatchSchedulePrompt(query: string, sport: string): string {
  const today = new Date().toISOString().split('T')[0]

  return `Сегодня ${today}. Вид спорта: ${sport}.

Найди РАСПИСАНИЕ ближайших матчей команды "${query}" на ближайшую неделю.
Определи следующий предстоящий матч этой команды.

Для каждого матча определи:
- Полные официальные названия ОБЕИХ команд
- Турнир, стадию (регулярка, плей-офф, кубок, финал)
- Дату, время, место

Верни информацию о БЛИЖАЙШЕМ матче в формате JSON (без markdown, без \`\`\`json):
${JSON_TEMPLATE.replace('SPORT', sport)}

КРИТИЧЕСКИ ВАЖНО:
- Укажи ПОЛНЫЕ НАЗВАНИЯ обеих команд (не "TBD", не "соперник")
- Если идёт плей-офф — пары УЖЕ определены, найди соперника
- ТОЛЬКО JSON`
}

/**
 * Agent 3: News-based search — finds match info from recent news
 */
export function identifyMatchNewsPrompt(query: string, sport: string): string {
  const today = new Date().toISOString().split('T')[0]

  return `Сегодня ${today}.

Найди в последних новостях информацию о ближайшем матче: "${query}" (${sport}).
Ищи в спортивных новостях, анонсах матчей, превью.

Определи из новостей:
- Какие именно команды играют (полные официальные названия)
- Какой турнир и какая стадия (плей-офф, регулярка, кубок)
- Когда и где матч

Верни ТОЛЬКО JSON (без markdown, без \`\`\`json):
${JSON_TEMPLATE.replace('SPORT', sport)}

ВАЖНО:
- Обе команды должны быть названы ПОЛНЫМИ именами
- Никогда не пиши "TBD", "неизвестно", "определится позже"
- ТОЛЬКО JSON`
}

/**
 * Claude reviewer prompt — compares agent results, returns confidence level
 */
export function reviewMatchResultsPrompt(
  query: string,
  sport: string,
  candidates: Array<{ source: string; result: Record<string, unknown> | null; error?: string }>,
): string {
  const today = new Date().toISOString().split('T')[0]

  const candidatesText = candidates
    .map((c, i) => {
      if (c.error) return `Агент ${i + 1} (${c.source}): ОШИБКА — ${c.error}`
      return `Агент ${i + 1} (${c.source}):\n${JSON.stringify(c.result, null, 2)}`
    })
    .join('\n\n')

  return `Сегодня ${today}. Ты — ревьюер результатов поиска матча.

Исходный запрос пользователя: "${query}"
Вид спорта: ${sport}

Поисковые агенты искали информацию о матче. Вот их результаты:

${candidatesText}

Твоя задача — оценить УВЕРЕННОСТЬ в результатах:

**confidence: "high"** если:
- Хотя бы 2 агента нашли ОДИНАКОВЫЕ команды (homeTeam + awayTeam совпадают)
- Даты совпадают или отличаются не более чем на 1 день
- Стадия турнира согласована

**confidence: "low"** если:
- Агенты нашли РАЗНЫХ соперников
- Даты сильно отличаются (>1 день)
- Только 1 агент вернул результат и он сомнительный
- Команда указана как "TBD", "неизвестно" и т.д.

Если confidence HIGH — собери лучший результат в поле match, объединив данные от всех агентов.
Если confidence LOW — верни match: null и опиши конфликт в conflictSummary.

КРИТЕРИИ ЛУЧШЕГО РЕЗУЛЬТАТА:
- Обе команды по полному названию (не "TBD")
- Точная стадия турнира (плей-офф > регулярка)
- Дата в будущем (сегодня: ${today})
- Предпочитай результат с venue и time`
}

/**
 * Refinement round prompt — searches with context from previous round
 */
export function identifyMatchRefinementPrompt(
  query: string,
  sport: string,
  previousResults: string,
  conflictSummary: string,
): string {
  const today = new Date().toISOString().split('T')[0]

  return `Сегодня ${today}. Вид спорта: ${sport}.

Нужно УТОЧНИТЬ информацию о матче. Исходный запрос: "${query}"

Предыдущие поисковые агенты дали противоречивые результаты:
${previousResults}

Конфликт: ${conflictSummary}

Найди ТОЧНУЮ информацию о ближайшем предстоящем матче этой команды.
Проверь: расписание лиги, турнирную сетку плей-офф, последние анонсы матчей.

Верни ТОЛЬКО JSON (без markdown):
${JSON_TEMPLATE.replace('SPORT', sport)}

КРИТИЧЕСКИ ВАЖНО:
- Обе команды ПОЛНЫМ НАЗВАНИЕМ (не "TBD", не "неизвестно")
- Точная стадия (плей-офф/регулярка/кубок)
- ТОЛЬКО JSON`
}

// ── Step 2: Stats, form, H2H, odds ──

const sportSpecificStats: Record<string, string> = {
  football: `"stats": {
    "home": {
      "goalsScored": 1.8,
      "goalsConceded": 0.9,
      "xG": 1.7,
      "xGA": 1.0,
      "shotsOnTarget": 5.2,
      "possession": 55,
      "corners": 5.8,
      "yellowCards": 1.9,
      "cleanSheets": 3,
      "bttsPct": 55,
      "over25Pct": 60
    },
    "away": { ... аналогично ... }
  }`,

  hockey: `"stats": {
    "home": {
      "goalsScored": 2.8,
      "goalsConceded": 1.6,
      "xG": null,
      "shotsOnTarget": 30.5,
      "possession": null,
      "corners": null,
      "yellowCards": null,
      "cleanSheets": null,
      "bttsPct": null,
      "over25Pct": null
    },
    "away": { ... аналогично ... }
  }`,

  basketball: `"stats": {
    "home": {
      "goalsScored": 95.2,
      "goalsConceded": 88.4,
      "xG": null,
      "shotsOnTarget": null,
      "possession": null,
      "corners": null,
      "yellowCards": null,
      "cleanSheets": null,
      "bttsPct": null,
      "over25Pct": null
    },
    "away": { ... аналогично ... }
  }`,
}

const sportStatsRules: Record<string, string> = {
  football: `- goalsScored/goalsConceded — средние за последние 5-10 матчей
- xG/xGA — если доступны, иначе null
- shotsOnTarget, possession, corners, yellowCards — средние
- cleanSheets — количество из последних 5-10
- bttsPct, over25Pct — процент матчей`,

  hockey: `- goalsScored/goalsConceded — средние за последние 5-10 матчей
- shotsOnTarget — среднее бросков в створ за матч
- Поля possession, corners, yellowCards, cleanSheets, bttsPct, over25Pct — всегда null (не применимо для хоккея)
- xG — null (не используется в хоккее)`,

  basketball: `- goalsScored/goalsConceded — средние очки за матч за последние 5-10 игр
- Все остальные поля stats — null (не применимо для баскетбола)`,
}

export function collectStatsPrompt(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  round: string | undefined,
  date: string,
  sport: string,
): string {
  const stageInfo = round ? `, ${round}` : ''

  return `Ты — спортивный журналист. Подготовь статистическую справку к предстоящему матчу:

Матч: ${homeTeam} vs ${awayTeam}
Турнир: ${competition}${stageInfo}
Дата: ${date}
Вид спорта: ${sport}

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json):
{
  "form": {
    "home": {
      "last5": ["W","D","L","W","W"],
      "streak": "2W"
    },
    "away": {
      "last5": ["L","W","D","W","L"],
      "streak": "1L"
    }
  },
  "h2h": {
    "homeWins": 3,
    "awayWins": 2,
    "draws": 1,
    "recentGames": [
      { "date": "2025-10-15", "score": "2:1", "competition": "${competition}" }
    ]
  },
  ${sportSpecificStats[sport] || sportSpecificStats.football},
  "odds": {
    "bookmakers": []
  }
}

ПРАВИЛА:
- last5 — последние 5 матчей команды (любые, не только друг с другом), W/D/L
- h2h.recentGames — ВСЕ матчи между этими командами В ТЕКУЩЕМ СЕЗОНЕ (не ограничивай)
${sportStatsRules[sport] || sportStatsRules.football}
- odds.bookmakers — оставь пустым массивом []
- ТОЛЬКО JSON, никакого текста вокруг`
}

// ── Step 3: Context factors (motivation, injuries, rest) ──

const sportContextRules: Record<string, string> = {
  football: `- weather: температура и погодные условия на стадионе
- restDays: дни отдыха с последнего матча для каждой команды
- referee: имя судьи, среднее ЖК за матч, пенальти за матч (если найдено, иначе null)
- recentTransfers: важные трансферы (если есть)`,

  hockey: `- weather: всегда null (крытая арена)
- restDays: дни отдыха с последнего матча для каждой команды
- referee: null (не влияет в хоккее)
- recentTransfers: важные трансферы (если есть)`,

  basketball: `- weather: всегда null (крытая арена)
- restDays: дни отдыха с последнего матча для каждой команды
- referee: null (не влияет в баскетболе)
- recentTransfers: важные трансферы (если есть)`,
}

export function collectContextPrompt(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  round: string | undefined,
  date: string,
  sport: string,
): string {
  const stageInfo = round ? `, ${round}` : ''

  return `Ты — спортивный журналист. Подготовь контекстную справку к предстоящему матчу:

Матч: ${homeTeam} vs ${awayTeam}
Турнир: ${competition}${stageInfo}
Дата: ${date}
Вид спорта: ${sport}

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json):
{
  "motivation": {
    "home": { "level": "high", "reason": "краткая причина мотивации" },
    "away": { "level": "medium", "reason": "краткая причина мотивации" }
  },
  "injuries": {
    "home": [
      { "name": "Имя Фамилия", "role": "Нападающий", "reason": "injury", "details": "травма колена", "impact": "key" }
    ],
    "away": []
  },
  "contextFactors": {
    "weather": ${sport === 'football' ? '{ "temp": 5, "condition": "облачно" }' : 'null'},
    "restDays": { "home": 4, "away": 5 },
    "referee": ${sport === 'football' ? '{ "name": "Имя", "avgYellowCards": 4.2, "penaltiesPerGame": 0.3 }' : 'null'},
    "recentTransfers": []
  }
}

ПРАВИЛА:
- motivation.level: high/medium/low — учитывай стадию турнира, позицию в таблице, важность матча
- injuries: только подтверждённые травмы и дисквалификации. Если все в строю — пустой массив
- impact: key (основной игрок), rotation (ротационный), minor (малое влияние)
${sportContextRules[sport] || sportContextRules.football}
- ТОЛЬКО JSON, никакого текста вокруг`
}
