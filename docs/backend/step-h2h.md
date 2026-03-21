# Шаг 4 — H2H (встречи в сезоне)

**Источник**: Perplexity API
**Промпт**: [`prompts/h2h.md`](../prompts/h2h.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}
```

## Логика

1. Формируем промпт — все матчи между командами в текущем сезоне лиги
2. Запрос в Perplexity
3. Парсим ответ

## Выход

```ts
interface H2HData {
  games: H2HGame[];
}

interface H2HGame {
  date: string;    // "2025-11-15"
  score: string;   // "2:1"
  venue: string;   // "Арена ЦСКА"
}
```
