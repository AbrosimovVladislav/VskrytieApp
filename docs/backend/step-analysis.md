# Шаг 8 — Анализ (Claude Sonnet)

**Источник**: Claude API
**Промпт**: [`prompts/analysis-claude.md`](../prompts/analysis-claude.md)

## Вход

Все данные, собранные на шагах 2–7:

```ts
{
  match: MatchInfo;
  motivation: MotivationData;
  form: FormData;
  h2h: H2HData;
  stats: StatsData;
  squadContext: SquadContextData;
  odds: OddsData;
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
  match: { team1: string; team2: string; date: string; time: string; venue: string; league: string };

  motivation: { data: { team1: string; team2: string }; analysis: string };
  form:       { data: { team1_last5: any[]; team2_last5: any[] }; analysis: string };
  h2h:        { data: { games: any[] }; analysis: string };
  stats:      { data: { team1: any; team2: any }; analysis: string };
  context:    { data: { team1: string; team2: string }; analysis: string };
  odds:       { data: { bookmakers: any[] }; analysis: string };

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
