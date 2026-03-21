import { MatchInfo, LeagueConfig } from "@/types/pipeline";

interface FindMatchInput {
  query: string;
  sport: string;
  leagueConfig: LeagueConfig;
}

export async function findMatch(input: FindMatchInput): Promise<MatchInfo> {
  // TODO: Phase 2 — real Perplexity request
  await delay(800);

  return {
    team1: "ЦСКА",
    team2: "СКА",
    date: "2026-03-25",
    time: "19:30 МСК",
    venue: "ЦСКА Арена",
    league: input.leagueConfig.name,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
