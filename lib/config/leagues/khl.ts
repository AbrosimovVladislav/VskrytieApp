import { LeagueConfig } from "@/types/pipeline";

export const khlConfig: LeagueConfig = {
  id: "khl",
  sport: "hockey",
  name: "КХЛ",
  country: "Russia",
  season: "2025/2026",
  bookmakers: ["Фонбет", "Винлайн", "PARI", "Олимпбет", "Лига Ставок"],
  statsFields: [
    "position",
    "points",
    "goalsFor",
    "goalsAgainst",
    "avgGoalsFor",
    "avgGoalsAgainst",
    "powerPlayPct",
    "penaltyKillPct",
    "penaltyMinutes",
    "shotsPerGame",
  ],
  betMarkets: ["outcome_regular", "total"],
};
