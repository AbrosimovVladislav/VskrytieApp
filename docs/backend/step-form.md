# Шаг 3 — Форма команд (последние 5 матчей)

**Источник**: Perplexity API
**Промпт**: [`prompts/form.md`](../prompts/form.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}
```

## Логика

1. Формируем промпт с командами, лигой, сезоном
2. Запрос в Perplexity
3. Парсим ответ — по 5 матчей для каждой команды

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
