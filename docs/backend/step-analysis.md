# Шаг 5 — Анализ (Claude Sonnet)

**Источник**: Claude API
**Промпт**: [`prompts/analysis-claude.md`](../prompts/analysis-claude.md)

## Вход

Все данные, собранные на шагах 2–4:

```ts
{
  match: MatchInfo;
  odds: OddsData;
  squadContext: SquadContextData;
  form: FormData;
  leagueConfig: LeagueConfig;
}
```

## Логика

1. Системный промпт адаптируется под спорт из конфига (хоккейный / футбольный / баскетбольный аналитик)
2. Все данные собираются в один user-промпт
3. Claude возвращает структурированный JSON — `AnalysisReport`

## Выход

```ts
interface AnalysisReport {
  match: { team1: string; team2: string; date: string; time: string; league: string };

  odds:    { data: { bookmakers: any[] }; analysis: string };
  context: { data: { team1: string; team2: string }; analysis: string };
  form:    { data: { team1_last5: any[]; team2_last5: any[] }; analysis: string };

  recommendation: {
    summary: string;
    bets: RecommendedBet[];
  };
}

interface RecommendedBet {
  market: string;        // "Исход в основное время"
  pick: string;          // "П1"
  confidence: "high" | "medium" | "low";
  reasoning: string;
}
```

Каждая секция содержит `data` (факты) + `analysis` (1–2 предложения от Claude). Это позволяет UI отображать и сырые данные, и интерпретацию.
