import { MatchInfo, LeagueConfig, SquadContextData } from "@/types/pipeline";

interface SquadContextInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchSquadContext(
  input: SquadContextInput
): Promise<SquadContextData> {
  // TODO: Phase 3.5 — real Perplexity request
  await delay(550);

  return {
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
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
