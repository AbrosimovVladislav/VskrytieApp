import { LeagueConfig } from "@/types/pipeline";
import { khlConfig } from "./khl";

const leagues: Record<string, LeagueConfig> = {
  khl: khlConfig,
};

export function getLeagueConfig(leagueId: string): LeagueConfig {
  const config = leagues[leagueId];
  if (!config) {
    throw new Error(`Unknown league: ${leagueId}`);
  }
  return config;
}

export function getLeaguesBySport(sport: string): LeagueConfig[] {
  return Object.values(leagues).filter((l) => l.sport === sport);
}

export function getAllSports(): string[] {
  return [...new Set(Object.values(leagues).map((l) => l.sport))];
}
