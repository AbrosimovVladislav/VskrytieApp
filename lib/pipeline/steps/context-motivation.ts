import { MatchInfo, LeagueConfig, MotivationData } from "@/types/pipeline";

interface ContextMotivationInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchContextMotivation(
  input: ContextMotivationInput
): Promise<MotivationData> {
  // TODO: Phase 3.1 — real Perplexity request
  await delay(600);

  return {
    team1: {
      position: "3-е место, Западная конференция",
      fighting_for: "Борьба за преимущество домашней площадки в плей-офф",
      priority: "Высокий — важно закрепиться в тройке",
    },
    team2: {
      position: "1-е место, Западная конференция",
      fighting_for: "Лидерство в конференции",
      priority: "Средний — позиция уже комфортная",
    },
    stage: "Регулярный сезон, финальная треть",
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
