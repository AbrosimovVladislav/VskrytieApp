import { MatchInfo, LeagueConfig, SquadContextData, DebugLog } from "@/types/pipeline";

interface SquadContextInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface SquadContextResult {
  data: SquadContextData;
  debugLogs: DebugLog[];
}

export async function fetchSquadContext(
  input: SquadContextInput
): Promise<SquadContextResult> {
  // TODO: Phase 3.5 — real Perplexity request
  await delay(550);

  return {
    data: {
      team1: {
        injuries: "Травмирован нападающий Окулов (колено, 2-3 недели)",
        media_summary:
          "Аналитики отмечают стабильную игру в большинстве, но проблемы в обороне при контратаках",
        rotation_expected: "Ротация не ожидается, основной состав",
      },
      team2: {
        injuries: "Все ключевые игроки в строю",
        media_summary:
          "Команда в отличной форме, журналисты выделяют связку Шипачёв — Ткачёв",
        rotation_expected: "Возможен отдых третьего вратаря",
      },
    },
    debugLogs: [],
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
