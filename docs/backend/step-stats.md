# Шаг 5 — Статистика сезона

**Источник**: Perplexity API
**Промпт**: [`prompts/stats.md`](../prompts/stats.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig; // statsFields определяют какие метрики запрашивать
}
```

## Логика

1. Из `leagueConfig.statsFields` формируем список метрик
2. Формируем промпт — статистика обеих команд за сезон
3. Запрос в Perplexity
4. Парсим ответ

## Выход

```ts
interface StatsData {
  team1: Record<string, string | number>;
  team2: Record<string, string | number>;
}
```

Набор ключей динамический — зависит от `statsFields` в конфиге лиги.

**Пример для КХЛ**:
```json
{
  "team1": {
    "position": 5,
    "points": 78,
    "goalsFor": 156,
    "goalsAgainst": 132,
    "avgGoalsFor": 2.8,
    "avgGoalsAgainst": 2.4,
    "powerPlayPct": 22.5,
    "penaltyKillPct": 81.3,
    "penaltyMinutes": 8.2,
    "shotsPerGame": 31.4
  }
}
```
