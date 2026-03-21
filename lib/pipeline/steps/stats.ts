import { MatchInfo, LeagueConfig, StatsData, DebugLog } from "@/types/pipeline";

interface StatsInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface StatsResult {
  data: StatsData;
  debugLogs: DebugLog[];
}

export async function fetchStats(input: StatsInput): Promise<StatsResult> {
  // TODO: Phase 3.4 — real Perplexity request
  await delay(600);

  return {
    data: {
      team1: {
        position: 3,
        points: 85,
        goalsFor: 168,
        goalsAgainst: 125,
        avgGoalsFor: 3.0,
        avgGoalsAgainst: 2.2,
        powerPlayPct: 24.1,
        penaltyKillPct: 83.5,
        penaltyMinutes: 7.8,
        shotsPerGame: 32.6,
      },
      team2: {
        position: 1,
        points: 98,
        goalsFor: 185,
        goalsAgainst: 112,
        avgGoalsFor: 3.3,
        avgGoalsAgainst: 2.0,
        powerPlayPct: 26.3,
        penaltyKillPct: 86.1,
        penaltyMinutes: 6.4,
        shotsPerGame: 34.2,
      },
    },
    debugLogs: [],
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
