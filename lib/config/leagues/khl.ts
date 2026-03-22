import type { LeagueConfig } from "@/types/pipeline";

export const khlConfig: LeagueConfig = {
  id: "khl",
  sport: "hockey",
  api_sport: "hockey",
  api_league_id: 255,
  name: "КХЛ",
  country: "Russia",
  season: 2025,
  bookmakers: ["Фонбет", "Винлайн", "PARI", "Олимпбет", "Лига Ставок"],
  betMarkets: ["outcome_regular", "total"],
};
