# Шаг 1 — Поиск матча

**Источник**: Perplexity API
**Промпт**: [`prompts/find-match.md`](../prompts/find-match.md)

## Вход

```ts
{
  query: string;   // запрос пользователя ("ЦСКА", "Спартак Динамо")
  sport: string;   // из UI
  league: string;  // из UI (id лиги)
}
```

## Логика

1. Из `league` берём конфиг → `name`, `season`
2. Формируем промпт → запрос в Perplexity
3. Парсим ответ → `MatchInfo`

## Выход

```ts
interface MatchInfo {
  team1: string;
  team2: string;
  date: string;      // "2026-03-25"
  time: string;      // "19:30 МСК"
  venue: string;     // "Арена ЦСКА"
  league: string;    // "КХЛ"
}
```

## Если не удалось определить

Возвращаем пользователю уточняющий вопрос с вариантами (если есть). Это **единственный шаг** где возможна остановка pipeline.

```ts
interface MatchClarification {
  message: string;
  suggestions?: string[];
}
```
