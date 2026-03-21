// ── Step 1: Match identification ──

export function identifyMatchPrompt(query: string, sport: string): string {
  const today = new Date().toISOString().split('T')[0]

  return `Ты — спортивный аналитик. Сегодня ${today}.

Запрос: "${query}"
Вид спорта: ${sport}

Найди ближайший предстоящий матч по этому запросу. Определи ТОЧНО:
- Какой это турнир и КАКАЯ СТАДИЯ (регулярный сезон, плей-офф, кубок, финал, полуфинал и т.д.)
- Полные официальные названия команд
- Дату, время и место проведения

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json):
{
  "sport": "${sport}",
  "homeTeam": "полное официальное название",
  "awayTeam": "полное официальное название",
  "competition": "название лиги/турнира",
  "round": "стадия: Тур 28 / Плей-офф 1/4 финала, 1-й матч / Финал и т.д.",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "venue": "название арены/стадиона"
}

ВАЖНО:
- Определи стадию турнира ТОЧНО (плей-офф ≠ регулярный сезон)
- ТОЛЬКО JSON, никакого текста вокруг`
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

  return `Ты — спортивный аналитик. Собери статистику для матча:

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
    "bookmakers": [
      { "name": "Фонбет", "values": { "П1": 1.85, "X": 3.40, "П2": 4.20 } },
      { "name": "1xBet", "values": { "П1": 1.90, "X": 3.35, "П2": 4.10 } }
    ]
  }
}

ПРАВИЛА:
- last5 — последние 5 матчей команды (любые, не только друг с другом), W/D/L
- h2h.recentGames — ВСЕ матчи между этими командами В ТЕКУЩЕМ СЕЗОНЕ (не ограничивай)
${sportStatsRules[sport] || sportStatsRules.football}
- Коэффициенты — реальные от реальных букмекеров (П1/X/П2)
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

  return `Ты — спортивный аналитик. Собери контекстные факторы для матча:

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
