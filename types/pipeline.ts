// ─── League Config ───

export interface LeagueConfig {
  id: string;
  sport: string;
  name: string;
  country: string;
  season: string;
  bookmakers: string[];
  statsFields: string[];
  betMarkets: string[];
}

// ─── Step 1: Find Match ───

export interface MatchInfo {
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  league: string;
}

export interface MatchClarification {
  message: string;
  suggestions?: string[];
}

// ─── Step 2: Context & Motivation ───

export interface TeamMotivation {
  position: string;
  fighting_for: string;
  priority: string;
}

export interface MotivationData {
  team1: TeamMotivation;
  team2: TeamMotivation;
  stage: string;
}

// ─── Step 3: Form ───

export interface GameResult {
  date: string;
  opponent: string;
  score: string;
  home: boolean;
  result: "W" | "L" | "OTW" | "OTL";
}

export interface FormData {
  team1_last5: GameResult[];
  team2_last5: GameResult[];
}

// ─── Step 4: H2H ───

export interface H2HGame {
  date: string;
  score: string;
  venue: string;
}

export interface H2HData {
  games: H2HGame[];
}

// ─── Step 5: Stats ───

export interface StatsData {
  team1: Record<string, string | number>;
  team2: Record<string, string | number>;
}

// ─── Step 6: Squad Context ───

export interface TeamSquadContext {
  injuries: string;
  media_summary: string;
  rotation_expected: string;
}

export interface SquadContextData {
  team1: TeamSquadContext;
  team2: TeamSquadContext;
}

// ─── Step 7: Odds ───

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

// ─── Step 8: Analysis ───

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
    venue: string;
    league: string;
  };

  motivation: { data: { team1: string; team2: string }; analysis: string };
  form: { data: { team1_last5: GameResult[]; team2_last5: GameResult[] }; analysis: string };
  h2h: { data: { games: H2HGame[] }; analysis: string };
  stats: { data: { team1: Record<string, string | number>; team2: Record<string, string | number> }; analysis: string };
  context: { data: { team1: string; team2: string }; analysis: string };
  odds: { data: { bookmakers: BookmakerOdds[] }; analysis: string };

  recommendation: {
    summary: string;
    bets: RecommendedBet[];
  };
}

// ─── Pipeline ───

export interface PipelineInput {
  match: MatchInfo;
  league: string;
}

export type PipelineStepStatus = "waiting" | "in_progress" | "done" | "error";

export interface PipelineStepProgress {
  step: number;
  name: string;
  status: PipelineStepStatus;
}

export interface DebugLog {
  step: string;
  prompt: string;
  raw: string;
}

export interface PipelineResult {
  match: MatchInfo;
  motivation: MotivationData;
  form: FormData;
  h2h: H2HData;
  stats: StatsData;
  squadContext: SquadContextData;
  odds: OddsData;
  report: AnalysisReport;
  debugLogs?: DebugLog[];
}
