import { MatchInfo, LeagueConfig, H2HData } from "@/types/pipeline";

interface H2HInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchH2H(input: H2HInput): Promise<H2HData> {
  // TODO: Phase 3.3 — real Perplexity request
  await delay(500);

  return {
    games: [
      { date: "2025-11-15", score: "2:1", venue: "ЦСКА Арена" },
      { date: "2025-12-28", score: "1:3", venue: "Ледовый дворец" },
      { date: "2026-02-10", score: "4:2", venue: "ЦСКА Арена" },
    ],
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
