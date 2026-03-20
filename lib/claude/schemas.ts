import { z } from 'zod'
import { toJSONSchema } from 'zod/v4/core'

// ── Form ──

const FormResultSchema = z.enum(['W', 'D', 'L'])

const TeamFormSchema = z.object({
  last5: z.array(FormResultSchema).describe('Last 5 match results, most recent first'),
  streak: z.string().describe('Current streak, e.g. "3W", "2L", "1D"'),
  homeRecord: z.array(FormResultSchema).optional().describe('Last 4-5 home results'),
  awayRecord: z.array(FormResultSchema).optional().describe('Last 4-5 away results'),
})

// ── Stats ──

const TeamStatsSchema = z.object({
  goalsScored: z.number().describe('Average goals scored per game (last 5-10 matches)'),
  goalsConceded: z.number().describe('Average goals conceded per game'),
  xG: z.number().optional().describe('Average expected goals per game'),
  xGA: z.number().optional().describe('Average expected goals against per game'),
  shotsOnTarget: z.number().describe('Average shots on target per game'),
  possession: z.number().describe('Average possession %'),
  corners: z.number().describe('Average corners per game'),
  yellowCards: z.number().describe('Average yellow cards per game'),
  cleanSheets: z.number().describe('Clean sheets out of last 5-10 matches'),
  bttsPct: z.number().describe('% of matches where both teams scored'),
  over25Pct: z.number().describe('% of matches with total goals > 2.5'),
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
  }).optional().describe('null if indoor stadium'),
  restDays: z.object({
    home: z.number(),
    away: z.number(),
  }),
  referee: z.object({
    name: z.string(),
    avgYellowCards: z.number(),
    penaltiesPerGame: z.number(),
  }).optional().describe('null if not found'),
  recentTransfers: z.array(z.string()).optional(),
})

// ── Odds ──

const BookmakerOddsSchema = z.object({
  name: z.string(),
  values: z.record(z.string(), z.number()).describe('Market odds, e.g. {"П1": 1.85, "X": 3.40, "П2": 4.20}'),
})

// ── MatchData (Step 2 output) ──

export const MatchDataSchema = z.object({
  context: z.object({
    sport: z.enum(['football', 'hockey', 'basketball']),
    homeTeam: z.string().describe('Full official team name'),
    awayTeam: z.string().describe('Full official team name'),
    competition: z.string().describe('League or tournament name'),
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

// ── AnalysisReport (Step 3 output) ──

export const AnalysisReportSchema = z.object({
  sections: z.object({
    formAnalysis: z.string().describe('2-3 sentences analyzing both teams form + H2H'),
    statsAnalysis: z.string().describe('2-3 sentences comparing key metrics with numbers'),
    injuriesAnalysis: z.string().describe('1-2 sentences on injury impact'),
    contextAnalysis: z.string().describe('1-2 sentences on weather, fatigue, referee'),
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
    summary: z.string().describe('1-2 sentences, main conclusion with numbers'),
    confidence: z.enum(['high', 'medium', 'low']),
    bets: z.array(z.object({
      market: z.string().describe('Market name: П1, ТБ 2.5, BTTS Да, etc.'),
      reasoning: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
      value: z.enum(['underpriced', 'fair', 'overpriced']),
    })).describe('1-3 recommended bets'),
  }),
})

// ── JSON Schemas for tool_use ──

export const matchDataJsonSchema = toJSONSchema(MatchDataSchema, { target: 'draft-07' })
export const analysisReportJsonSchema = toJSONSchema(AnalysisReportSchema, { target: 'draft-07' })
