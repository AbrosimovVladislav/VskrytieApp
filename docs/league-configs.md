# Конфигурация по лигам

Для каждой лиги хранится конфиг, который сужает поиск и определяет специфику. При добавлении новой лиги — добавляется конфиг, а не переписывается код.

## Интерфейс

```ts
interface LeagueConfig {
  id: string;            // "khl", "rpl", "nba"
  sport: string;         // "hockey", "football", "basketball"
  api_sport: string;     // "hockey", "football", "basketball" (для API-Sports)
  api_league_id: number; // ID лиги в API-Sports
  name: string;          // "КХЛ"
  country: string;       // "Russia"
  season: number;        // 2025 (4-digit year, API-Sports format)
  bookmakers: string[];  // букмекеры для этой лиги
  betMarkets: string[];  // какие рынки для рекомендации
}
```

## Стартовый конфиг — КХЛ

```json
{
  "id": "khl",
  "sport": "hockey",
  "api_sport": "hockey",
  "api_league_id": 255,
  "name": "КХЛ",
  "country": "Russia",
  "season": 2025,
  "bookmakers": ["Фонбет", "Винлайн", "PARI", "Олимпбет", "Лига Ставок"],
  "betMarkets": ["outcome_regular", "total"]
}
```

- **Букмекеры**: Фонбет, Винлайн, PARI, Олимпбет, Лига Ставок
- **Рынки**: исход в основное время (П1/X/П2), тотал (Б/М N.5)
