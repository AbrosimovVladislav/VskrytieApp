// === League Config ===

export interface LeagueConfig {
  id: string;
  sport: string;
  api_sport: string;
  api_league_id: number;
  name: string;
  country: string;
  season: number;
  bookmakers: string[];
  betMarkets: string[];
}

// === Step 1: Find Match ===

export interface MatchInfo {
  team1: string;
  team2: string;
  game_id: number;
  team1_id: number;
  team2_id: number;
  date: string;        // "2026-03-25"
  time: string;        // "19:30 МСК"
  league: string;      // "КХЛ"
}

export interface MatchClarification {
  message: string;
  suggestions?: string[];
}

// === Step 2: Odds ===

export interface BookmakerOdds {
  name: string;
  outcome_home: number;
  outcome_draw: number;
  outcome_away: number;
  total_over: number;
  total_under: number;
}

export interface OddsData {
  bookmakers: BookmakerOdds[];
}

// === Step 3: Form ===

export interface GameResult {
  date: string;
  opponent: string;
  score: string;       // "3:2"
  home: boolean;
  result: "W" | "L" | "OTW" | "OTL";
}

export interface FormData {
  team1_last5: GameResult[];
  team2_last5: GameResult[];
}

// === Step 4: Squad Context ===

export interface TeamContext {
  injuries: string;
  media_summary: string;
  rotation_expected: string;
}

export interface SquadContextData {
  team1: TeamContext;
  team2: TeamContext;
}

// === Step 5: Analysis ===

export interface RecommendedBet {
  market: string;
  pick: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface AnalysisReport {
  match: {
    team1: string;
    team2: string;
    date: string;
    time: string;
    league: string;
  };
  odds: {
    data: OddsData;
    analysis: string;
  };
  context: {
    data: { team1: string; team2: string };
    analysis: string;
  };
  form: {
    data: FormData;
    analysis: string;
  };
  recommendation: {
    summary: string;
    bets: RecommendedBet[];
  };
}
