# Шаг 3 — Форма команд (последние 5 матчей)

**Источник**: API-Sports Hockey v1
**Эндпоинт**: `GET /games?team={team_id}&league={api_league_id}&season={season}`

## Вход

```ts
{
  match: MatchInfo;  // team1_id, team2_id из шага 1
  leagueConfig: LeagueConfig; // api_league_id, season
}
```

## Логика

1. Два параллельных запроса:
   - `GET /games?team={team1_id}&league={api_league_id}&season={season}`
   - `GET /games?team={team2_id}&league={api_league_id}&season={season}`
2. Фильтруем только завершённые матчи по статусу:
   - `FT` — Finished (основное время)
   - `AOT` — After Over Time
   - `AP` — After Penalties
3. Сортируем по дате (новые первые), берём последние 5
4. Парсим результаты — счета, дома/выезд, результат

> **Важно**: в Hockey API нет параметра `last=5`. Получаем все матчи сезона и фильтруем завершённые на стороне сервера.

### Определение результата (W/L/OTW/OTL)

- Статус `FT` → победитель = `W`, проигравший = `L`
- Статус `AOT` → победитель = `OTW`, проигравший = `OTL`
- Статус `AP` → победитель = `OTW`, проигравший = `OTL`

## Выход

```ts
interface FormData {
  team1_last5: GameResult[];
  team2_last5: GameResult[];
}

interface GameResult {
  date: string;       // "2026-03-20"
  opponent: string;   // "Динамо Москва"
  score: string;      // "3:2"
  home: boolean;      // true = дома, false = выезд
  result: "W" | "L" | "OTW" | "OTL"; // победа/поражение/ОТ
}
```
