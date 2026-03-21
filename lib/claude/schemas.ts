import { z } from 'zod'
import { toJSONSchema } from 'zod/v4/core'

// ── Form ──

const FormResultSchema = z.enum(['W', 'D', 'L'])

const TeamFormSchema = z.object({
  last5: z.array(FormResultSchema).describe('Last 5 match results, most recent first'),
  streak: z.string().describe('Current streak, e.g. "3W", "2L", "1D"'),
})

// ── Stats ──

const TeamStatsSchema = z.object({
  goalsScored: z.number().nullable().describe('Average goals scored per game'),
  goalsConceded: z.number().nullable().describe('Average goals conceded per game'),
  xG: z.number().nullable().optional().describe('Expected goals per game (football only)'),
  xGA: z.number().nullable().optional().describe('Expected goals against per game (football only)'),
  shotsOnTarget: z.number().nullable().describe('Average shots/shots on target per game'),
  possession: z.number().nullable().describe('Average possession % (football only, null for hockey/basketball)'),
  corners: z.number().nullable().describe('Average corners per game (football only)'),
  yellowCards: z.number().nullable().describe('Average yellow cards per game (football only)'),
  cleanSheets: z.number().nullable().describe('Clean sheets count (null if not applicable)'),
  bttsPct: z.number().nullable().describe('% matches where both teams scored (null if not applicable)'),
  over25Pct: z.number().nullable().describe('% matches with total > 2.5 (null if not applicable)'),
})

// ── Injuries ──

const AbsenceSchema = z.object({
  name: z.string(),
  role: z.string().describe('Position: Нападающий, Защитник, Полузащитник, Вратарь'),
  reason: z.enum(['injury', 'suspension', 'personal']),
  details: z.string().optional(),
  impact: z.enum(['key', 'rotation', 'minor']),
})

// ── H2H ──

const H2HGameSchema = z.object({
  date: z.string(),
  score: z.string().describe('Score like "2:1"'),
  competition: z.string(),
})

// ── Context Factors ──

const ContextFactorsSchema = z.object({
  weather: z.object({
    temp: z.number(),
    condition: z.string(),
  }).nullable().optional().describe('null for indoor sports (hockey, basketball)'),
  restDays: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
  referee: z.object({
    name: z.string(),
    avgYellowCards: z.number(),
    penaltiesPerGame: z.number(),
  }).nullable().optional().describe('Football only, null for hockey/basketball'),
  recentTransfers: z.array(z.string()).optional(),
})

// ── Odds ──

const BookmakerOddsSchema = z.object({
  name: z.string(),
  values: z.record(z.string(), z.number()).describe('Market odds, e.g. {"П1": 1.85, "X": 3.40, "П2": 4.20}'),
})

// ── Step 1: Match identification ──

export const MatchContextSchema = z.object({
  sport: z.enum(['football', 'hockey', 'basketball']),
  homeTeam: z.string().describe('Full official team name'),
  awayTeam: z.string().describe('Full official team name'),
  competition: z.string().describe('League or tournament name'),
  round: z.string().optional().describe('Round or stage, e.g. "Тур 28", "1/4 финала", "Плей-офф, 1-й матч"'),
  date: z.string(),
  time: z.string().optional(),
  venue: z.string().optional(),
})

// ── Step 2: Stats + form + H2H + odds ──

export const MatchStatsSchema = z.object({
  form: z.object({
    home: TeamFormSchema,
    away: TeamFormSchema,
  }),
  h2h: z.object({
    homeWins: z.number(),
    awayWins: z.number(),
    draws: z.number(),
    recentGames: z.array(H2HGameSchema).describe('ALL games between teams this season'),
  }),
  stats: z.object({
    home: TeamStatsSchema,
    away: TeamStatsSchema,
  }),
  odds: z.object({
    bookmakers: z.array(BookmakerOddsSchema),
  }),
})

// ── Step 3: Context (motivation, injuries, rest days) ──

export const MatchContextFactorsSchema = z.object({
  motivation: z.object({
    home: z.object({
      level: z.enum(['high', 'medium', 'low']),
      reason: z.string(),
    }),
    away: z.object({
      level: z.enum(['high', 'medium', 'low']),
      reason: z.string(),
    }),
  }),
  injuries: z.object({
    home: z.array(AbsenceSchema),
    away: z.array(AbsenceSchema),
  }),
  contextFactors: ContextFactorsSchema,
})

// ── Combined MatchData (assembled from steps 1-3) ──

export const MatchDataSchema = z.object({
  context: z.object({
    sport: z.enum(['football', 'hockey', 'basketball']),
    homeTeam: z.string(),
    awayTeam: z.string(),
    competition: z.string(),
    round: z.string().optional(),
    date: z.string(),
    time: z.string().optional(),
    venue: z.string().optional(),
    motivation: z.object({
      home: z.object({
        level: z.enum(['high', 'medium', 'low']),
        reason: z.string(),
      }),
      away: z.object({
        level: z.enum(['high', 'medium', 'low']),
        reason: z.string(),
      }),
    }),
  }),
  form: z.object({
    home: TeamFormSchema,
    away: TeamFormSchema,
  }),
  h2h: z.object({
    homeWins: z.number(),
    awayWins: z.number(),
    draws: z.number(),
    recentGames: z.array(H2HGameSchema),
  }),
  stats: z.object({
    home: TeamStatsSchema,
    away: TeamStatsSchema,
  }),
  injuries: z.object({
    home: z.array(AbsenceSchema),
    away: z.array(AbsenceSchema),
  }),
  contextFactors: ContextFactorsSchema,
  odds: z.object({
    bookmakers: z.array(BookmakerOddsSchema),
  }),
})

// ── AnalysisReport (Claude analysis output) ──

export const AnalysisReportSchema = z.object({
  sections: z.object({
    formAnalysis: z.string().describe('1-2 sentences analyzing both teams form + H2H'),
    statsAnalysis: z.string().describe('1-2 sentences comparing key metrics with numbers'),
    injuriesAnalysis: z.string().describe('1-2 sentences on injury impact'),
    contextAnalysis: z.string().describe('1-2 sentences on context factors'),
    oddsAnalysis: z.string().describe('1-2 sentences on odds value'),
  }),
  odds: z.object({
    average: z.record(z.string(), z.number()).describe('Average odds per market'),
    bestValue: z.object({
      market: z.string(),
      bookmaker: z.string(),
      odds: z.number(),
    }).optional(),
    valueAssessment: z.array(z.object({
      market: z.string(),
      indicator: z.enum(['underpriced', 'fair', 'overpriced']),
    })),
  }),
  recommendation: z.object({
    summary: z.string().describe('1-2 sentences, 40-60 words max, main conclusion with numbers'),
    confidence: z.enum(['high', 'medium', 'low']),
    bets: z.array(z.object({
      market: z.string().describe('Market name: П1, ТБ 5.5, etc.'),
      reasoning: z.string().describe('1-2 sentences max'),
      confidence: z.enum(['high', 'medium', 'low']),
      value: z.enum(['underpriced', 'fair', 'overpriced']),
    })).describe('1-2 recommended bets, no more'),
  }),
})

// ── JSON Schemas for tool_use ──

export const matchContextJsonSchema = toJSONSchema(MatchContextSchema, { target: 'draft-07' })
export const matchStatsJsonSchema = toJSONSchema(MatchStatsSchema, { target: 'draft-07' })
export const matchContextFactorsJsonSchema = toJSONSchema(MatchContextFactorsSchema, { target: 'draft-07' })
export const matchDataJsonSchema = toJSONSchema(MatchDataSchema, { target: 'draft-07' })
export const analysisReportJsonSchema = toJSONSchema(AnalysisReportSchema, { target: 'draft-07' })
