# Шаг 7 — Букмекерские линии

**Источник**: Perplexity API
**Промпт**: [`prompts/odds.md`](../prompts/odds.md)

## Вход

```ts
{
  match: MatchInfo;
  leagueConfig: LeagueConfig; // bookmakers определяют список БК
}
```

## Логика

1. Из `leagueConfig.bookmakers` берём список БК
2. Формируем промпт — коэффициенты от каждого БК
3. Запрос в Perplexity
4. Парсим ответ

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
  total_over: number;     // 1.85  (тотал больше 4.5)
  total_under: number;    // 1.95  (тотал меньше 4.5)
}
```

Набор рынков определяется `betMarkets` в конфиге лиги. Для КХЛ: исход в основное время + тотал 4.5.
