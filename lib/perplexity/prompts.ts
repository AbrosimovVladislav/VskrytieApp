export function collectPrompt(query: string, sport: string): string {
  const today = new Date().toISOString().split('T')[0]

  return `Ты — спортивный аналитик. Сегодня ${today}.

Запрос: "${query}"
Вид спорта: ${sport}

Найди ближайший/предстоящий матч и собери ВСЕ данные. Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json).

Структура JSON:
{
  "context": {
    "sport": "${sport}",
    "homeTeam": "полное название",
    "awayTeam": "полное название",
    "competition": "лига/турнир",
    "round": "тур или стадия (опционально)",
    "date": "YYYY-MM-DD",
    "time": "HH:MM (опционально)",
    "venue": "стадион (опционально)",
    "motivation": {
      "home": { "level": "high|medium|low", "reason": "почему" },
      "away": { "level": "high|medium|low", "reason": "почему" }
    }
  },
  "form": {
    "home": {
      "last5": ["W","D","L","W","W"],
      "streak": "2W",
      "homeRecord": ["W","W","D","L","W"]
    },
    "away": {
      "last5": ["L","W","D","W","L"],
      "streak": "1L",
      "awayRecord": ["L","W","D","L","W"]
    }
  },
  "h2h": {
    "homeWins": 3,
    "awayWins": 2,
    "draws": 1,
    "recentGames": [
      { "date": "2024-10-15", "score": "2:1", "competition": "РПЛ" }
    ]
  },
  "stats": {
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
    "away": {
      "goalsScored": 1.2,
      "goalsConceded": 1.3,
      "shotsOnTarget": 4.1,
      "possession": 48,
      "corners": 4.5,
      "yellowCards": 2.1,
      "cleanSheets": 2,
      "bttsPct": 60,
      "over25Pct": 50
    }
  },
  "injuries": {
    "home": [
      { "name": "Имя", "role": "Нападающий", "reason": "injury", "details": "травма колена", "impact": "key" }
    ],
    "away": []
  },
  "contextFactors": {
    "weather": { "temp": 5, "condition": "облачно" },
    "restDays": { "home": 4, "away": 5 },
    "referee": { "name": "Имя", "avgYellowCards": 4.2, "penaltiesPerGame": 0.3 }
  },
  "odds": {
    "bookmakers": [
      { "name": "Фонбет", "values": { "П1": 1.85, "X": 3.40, "П2": 4.20 } },
      { "name": "1xBet", "values": { "П1": 1.90, "X": 3.35, "П2": 4.10 } }
    ]
  }
}

ПРАВИЛА:
- Все числа в stats — СРЕДНИЕ за последние 5-10 матчей
- last5 — ровно 5 результатов: W/D/L
- Коэффициенты — реальные от реальных букмекеров
- Если данные не найдены — разумные значения или пустые массивы
- ТОЛЬКО JSON, никакого текста вокруг`
}
