# Шаг 4 — Кадры и контекст

**Источник**: Perplexity API
**Промпт**: [`prompts/squad-context.md`](../prompts/squad-context.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}
```

## Логика

1. Формируем промпт — травмы, дисквалификации, медиа-контекст за 2 недели
2. Запрос в Perplexity
3. Парсим ответ

## Выход

```ts
interface SquadContextData {
  team1: {
    injuries: string;        // "Травмирован нападающий Иванов (колено, 2-3 недели)"
    media_summary: string;   // "Аналитики отмечают нестабильную игру в обороне..."
    rotation_expected: string; // "Ротация не ожидается"
  };
  team2: {
    injuries: string;
    media_summary: string;
    rotation_expected: string;
  };
}
```
