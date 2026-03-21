import { MatchInfo, LeagueConfig, OddsData } from "@/types/pipeline";

interface OddsInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchOdds(input: OddsInput): Promise<OddsData> {
  // TODO: Phase 3.6 — real Perplexity request
  await delay(650);

  return {
    bookmakers: [
      { name: "Фонбет", outcome_home: 2.1, outcome_draw: 3.4, outcome_away: 3.15, total_over: 1.85, total_under: 1.95 },
      { name: "Винлайн", outcome_home: 2.05, outcome_draw: 3.5, outcome_away: 3.2, total_over: 1.83, total_under: 1.97 },
      { name: "PARI", outcome_home: 2.12, outcome_draw: 3.35, outcome_away: 3.1, total_over: 1.87, total_under: 1.93 },
      { name: "Олимпбет", outcome_home: 2.08, outcome_draw: 3.45, outcome_away: 3.18, total_over: 1.84, total_under: 1.96 },
      { name: "Лига Ставок", outcome_home: 2.15, outcome_draw: 3.3, outcome_away: 3.05, total_over: 1.88, total_under: 1.92 },
    ],
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
