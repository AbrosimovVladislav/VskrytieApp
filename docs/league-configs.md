# Конфигурация по лигам

Для каждой лиги хранится конфиг, который сужает поиск и определяет специфику. При добавлении новой лиги — добавляется конфиг, а не переписывается код.

## Интерфейс

```ts
interface LeagueConfig {
  id: string; // "khl", "rpl", "nba"
  sport: string; // "hockey", "football", "basketball"
  name: string; // "КХЛ"
  country: string; // "Russia"
  season: string; // "2025/2026"
  bookmakers: string[]; // 5 букмекеров для этой лиги
  statsFields: string[]; // какие метрики искать (зависит от спорта)
  betMarkets: string[]; // какие рынки для рекомендации
}
```

## Стартовый конфиг — КХЛ

```json
{
  "id": "khl",
  "sport": "hockey",
  "name": "КХЛ",
  "country": "Russia",
  "season": "2025/2026",
  "bookmakers": ["Фонбет", "Винлайн", "PARI", "Олимпбет", "Лига Ставок"],
  "statsFields": [
    "position", "points",
    "goalsFor", "goalsAgainst",
    "avgGoalsFor", "avgGoalsAgainst",
    "powerPlayPct", "penaltyKillPct",
    "penaltyMinutes", "shotsPerGame"
  ],
  "betMarkets": ["outcome_regular", "total"]
}
```

- **Букмекеры**: Фонбет, Винлайн, PARI, Олимпбет, Лига Ставок
- **Статистика**: голы, броски, большинство (%), меньшинство (%), штрафные минуты
- **Рынки**: исход в основное время (П1/X/П2), тотал (Б/М N.5)

## Разные виды спорта — разная статистика

| Спорт | Метрики |
|---|---|
| Хоккей | голы, броски, большинство, меньшинство, штрафы |
| Футбол | голы, xG, владение, удары в створ, угловые |
| Баскетбол | очки, подборы, передачи, % трёхочковых, темп |

Это определяется в `statsFields` конфига и влияет на промпт Perplexity и рендеринг UI.
