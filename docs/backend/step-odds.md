# Шаг 2 — Букмекерские линии

**Источник**: API-Sports Hockey v1
**Эндпоинт**: `GET /odds?game={game_id}`

## Вход

```ts
{
  match: MatchInfo;        // game_id из шага 1
  leagueConfig: LeagueConfig; // bookmakers определяют список БК
}
```

## Логика

1. `GET /odds?game={game_id}`
2. Из ответа API фильтруем букмекеров по `leagueConfig.bookmakers`
3. Для маппинга ID букмекеров → названия: `GET /odds/bookmakers` (кэшируем)
4. Для маппинга ID типов ставок → названия: `GET /odds/bets` (кэшируем)
5. Извлекаем рынки: исход в основное время (П1/X/П2) + тотал (Б/М)

> **Важно**: odds обновляются раз в день. Pre-match odds доступны за 1–7 дней до матча. Параметр фильтрации — `game` (не `fixture`).

## Дополнительные эндпоинты

- `GET /odds/bookmakers` — список всех букмекеров (id, name)
- `GET /odds/bets` — список всех типов ставок (id, name)

## Выход

```ts
interface OddsData {
  bookmakers: BookmakerOdds[];
}

interface BookmakerOdds {
  name: string;           // "Фонбет"
  outcome_home: number;   // 2.10
  outcome_draw: number;   // 3.40
  outcome_away: number;   // 3.15
  total_over: number;     // 1.85  (тотал больше N.5)
  total_under: number;    // 1.95  (тотал меньше N.5)
}
```

Набор рынков определяется `betMarkets` в конфиге лиги. Для КХЛ: исход в основное время + тотал 4.5.
