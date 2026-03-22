import { sportsApiGet } from "@/lib/api/sports-api";
import { perplexityQuery } from "@/lib/api/perplexity";
import type { LeagueConfig, MatchInfo, MatchClarification } from "@/types/pipeline";

interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

interface ApiGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  status: { short: string };
  league: { id: number; name: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
}

type FindMatchResult =
  | { type: "found"; match: MatchInfo }
  | { type: "clarification"; clarification: MatchClarification };

export async function findMatch(
  query: string,
  config: LeagueConfig,
): Promise<FindMatchResult> {
  // 1. Search team in API-Sports
  let teams = await searchTeams(query, config);

  // 2. Fallback: Perplexity for name clarification
  if (teams.length === 0) {
    const correctedName = await clarifyTeamName(query, config);
    if (correctedName) {
      teams = await searchTeams(correctedName, config);
    }
  }

  if (teams.length === 0) {
    return {
      type: "clarification",
      clarification: {
        message: `Не удалось найти команду "${query}" в ${config.name}`,
      },
    };
  }

  // Pick best match by name similarity
  const team = pickBestMatch(teams, query);

  // 3. Find next game for this team
  const game = await findNextGame(team.id, config);

  if (!game) {
    return {
      type: "clarification",
      clarification: {
        message: `У команды "${team.name}" нет предстоящих матчей в ${config.name}`,
      },
    };
  }

  return {
    type: "found",
    match: {
      team1: game.teams.home.name,
      team2: game.teams.away.name,
      game_id: game.id,
      team1_id: game.teams.home.id,
      team2_id: game.teams.away.id,
      date: game.date.split("T")[0],
      time: formatTimeMSK(game.date),
      league: config.name,
    },
  };
}

async function searchTeams(
  query: string,
  config: LeagueConfig,
): Promise<ApiTeam[]> {
  if (query.length < 3) return [];

  return sportsApiGet<ApiTeam[]>("/teams", {
    search: query,
    league: config.api_league_id,
    season: config.season,
  });
}

async function clarifyTeamName(
  query: string,
  config: LeagueConfig,
): Promise<string | null> {
  const prompt = `Пользователь ищет команду "${query}" в лиге ${config.name} (${config.sport}). Верни только точное официальное название команды на английском языке, как оно используется в API. Без пояснений, только название.`;

  try {
    const response = await perplexityQuery(prompt);
    const name = response.trim().replace(/['"]/g, "");
    return name.length >= 3 ? name : null;
  } catch {
    return null;
  }
}

function pickBestMatch(teams: ApiTeam[], query: string): ApiTeam {
  const q = query.toLowerCase();
  // Exact match first
  const exact = teams.find((t) => t.name.toLowerCase() === q);
  if (exact) return exact;
  // Starts with
  const startsWith = teams.find((t) => t.name.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;
  // Contains
  const contains = teams.find((t) => t.name.toLowerCase().includes(q));
  if (contains) return contains;
  // First result
  return teams[0];
}

async function findNextGame(
  teamId: number,
  config: LeagueConfig,
): Promise<ApiGame | null> {
  const games = await sportsApiGet<ApiGame[]>("/games", {
    team: teamId,
    league: config.api_league_id,
    season: config.season,
  });

  const now = Date.now();

  const upcoming = games
    .filter((g) => g.status.short === "NS" && g.timestamp * 1000 > now - 3600_000)
    .sort((a, b) => a.timestamp - b.timestamp);

  return upcoming[0] ?? null;
}

function formatTimeMSK(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }) + " МСК";
}
