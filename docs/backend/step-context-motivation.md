# Шаг 2 — Контекст и мотивация

**Источник**: Perplexity API
**Промпт**: [`prompts/context-motivation.md`](../prompts/context-motivation.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}
```

## Логика

1. Формируем промпт с командами, лигой, датой
2. Запрос в Perplexity
3. Парсим ответ

## Выход

```ts
interface MotivationData {
  team1: {
    position: string;       // "5-е место, Западная конференция"
    fighting_for: string;   // "Борьба за место в плей-офф"
    priority: string;       // "Высокий — каждое очко на счету"
  };
  team2: {
    position: string;
    fighting_for: string;
    priority: string;
  };
  stage: string;            // "Регулярный сезон, финальная треть"
}
```
