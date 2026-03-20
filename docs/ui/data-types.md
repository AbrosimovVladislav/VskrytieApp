# TypeScript интерфейсы данных

## MatchData (вход — собираем из Sports API + Perplexity)

```ts
interface MatchData {
  context: {
    sport: "football" | "hockey" | "basketball";
    homeTeam: string;
    awayTeam: string;
    competition: string;
    round?: string;
    date: string;
    time?: string;
    venue?: string;
    motivation: {
      home: { level: "high" | "medium" | "low"; reason: string };
      away: { level: "high" | "medium" | "low"; reason: string };
    };
  };
  form: {
    home: { last5: ("W"|"D"|"L")[]; streak: string; homeRecord: ("W"|"D"|"L")[] };
    away: { last5: ("W"|"D"|"L")[]; streak: string; awayRecord: ("W"|"D"|"L")[] };
  };
  h2h: {
    homeWins: number; awayWins: number; draws: number;
    recentGames: { date: string; score: string; competition: string }[];
  };
  stats: { home: TeamStats; away: TeamStats };
  injuries: { home: Absence[]; away: Absence[] };
  contextFactors: {
    weather?: { temp: number; condition: string };
    restDays: { home: number; away: number };
    referee?: { name: string; avgYellowCards: number; penaltiesPerGame: number };
    recentTransfers?: string[];
  };
  odds: {
    bookmakers: { name: string; values: Record<string, number> }[];
  };
}

interface TeamStats {
  goalsScored: number;
  goalsConceded: number;
  xG?: number;
  xGA?: number;
  shotsOnTarget: number;
  possession: number;
  corners: number;
  yellowCards: number;
  cleanSheets: number;
  bttsPct: number;
  over25Pct: number;
}

interface Absence {
  name: string;
  role: string;
  reason: "injury" | "suspension" | "personal";
  details?: string;
  impact: "key" | "rotation" | "minor";
}
```

## AnalysisReport (выход — генерирует Claude)

```ts
interface AnalysisReport {
  sections: {
    formAnalysis: string;      // 2-3 предложения
    statsAnalysis: string;     // 2-3 предложения
    injuriesAnalysis: string;  // 1-2 предложения
    contextAnalysis: string;   // 1-2 предложения
    oddsAnalysis: string;      // 1-2 предложения
  };
  odds: {
    average: Record<string, number>;
    bestValue?: { market: string; bookmaker: string; odds: number };
    valueAssessment: { market: string; indicator: "underpriced"|"fair"|"overpriced" }[];
  };
  recommendation: {
    summary: string;
    confidence: "high" | "medium" | "low";
    bets: {
      market: string;
      reasoning: string;
      confidence: "high" | "medium" | "low";
      value: "underpriced" | "fair" | "overpriced";
    }[];
  };
}
```

## FullReport (хранится в Supabase `structured_report`)

```ts
interface FullReport {
  matchData: MatchData;
  analysis: AnalysisReport;
}
```
