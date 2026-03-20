# Claude Web Search Pipeline — Design Spec

## Goal

Replace the Sports API + Perplexity pipeline with Claude Sonnet + web_search. Keep existing MatchData/AnalysisReport types and UI components. Simplify from 5 API integrations to 1 (Claude API).

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Simplification level | Keep MatchData/AnalysisReport types and UI | UI already built, types are good contracts |
| Number of Claude calls | 2 (collect + analyze) | Separation of facts vs analysis, easier debugging |
| Model | Sonnet for both | Good quality/cost balance, web search support |
| SSE steps | 3 (validate → collect → analyze) | Clear progress for user |
| Metrics (BTTS%, etc.) | Claude returns them directly | Simplifies pipeline, UI rework comes later |
| JSON enforcement | tool_use with schema | Guarantees valid MatchData/AnalysisReport JSON |

## Architecture

```
POST /api/analyze { query: string, sport: string }
        │
   Step 1: Validate (pure function, no API)
   Contract in:  { query: string, sport: string }
   Contract out: ValidatedQuery { query, sport, lang }
   SSE: step="search"
        │
   Step 2: Collect (Claude Sonnet + web_search tool)
   Contract in:  ValidatedQuery
   Contract out: MatchData (enforced via tool_use schema)
   SSE: step="collect", then section events for context/form/stats/injuries/context_factors/odds
        │
   Step 3: Analyze (Claude Sonnet, no web search)
   Contract in:  MatchData
   Contract out: AnalysisReport (enforced via tool_use schema)
   SSE: step="analyze", then section="recommendation"
        │
   Save to Supabase → SSE: type="done"
```

## Step Details

### Step 1: Validate

Pure function. Validates query is non-empty, sport is one of football/hockey/basketball. Returns `ValidatedQuery`. No API calls.

```typescript
type ValidatedQuery = {
  query: string    // cleaned user input
  sport: 'football' | 'hockey' | 'basketball'
  lang: 'ru' | 'en'  // detected from query
}
```

### Step 2: Collect (Claude + web_search → MatchData)

Single Claude API call with:
- **Model**: claude-sonnet-4-6
- **Tools**: `web_search` (Anthropic built-in) + `submit_match_data` (our tool_use with MatchData schema)
- **Prompt**: instructs Claude to search for the match, find current data, and call `submit_match_data` with structured results
- **Output**: MatchData JSON, validated against schema by tool_use

The prompt must instruct Claude to:
1. Find the next/upcoming match for the query
2. Search for recent form (last 5 results per team)
3. Search for H2H history
4. Search for injuries/suspensions
5. Search for betting odds
6. Search for context (weather, referee, transfers, motivation)
7. Call `submit_match_data` with all findings structured as MatchData

### Step 3: Analyze (Claude → AnalysisReport)

Single Claude API call with:
- **Model**: claude-sonnet-4-6
- **Tools**: `submit_analysis` (our tool_use with AnalysisReport schema)
- **Input**: full MatchData JSON in system/user message
- **Output**: AnalysisReport JSON

The prompt (existing `runClaudeAnalysis` prompt) tells Claude to analyze the data and produce sections + recommendation + bets.

## What Gets Removed

- `lib/sports-api/` — entire directory (client.ts, mappers.ts)
- `lib/calculations/metrics.ts` — server-side metrics
- `lib/openai/client.ts` — Perplexity calls (classifyQuery, findNextMatch, fetchMatchStats, fetchMatchData, fetchContextFromPerplexity)
- Sports API pipeline branch in `app/api/analyze/route.ts`
- Perplexity fallback pipeline in `app/api/analyze/route.ts`

## What Stays

- `lib/types/report.ts` — MatchData, AnalysisReport, FullReport types
- All `components/report/*` — UI components unchanged
- SSE streaming logic (simplified to 3 steps)
- Supabase save logic
- `parseMatchDataWithClaude` removed (Claude now returns MatchData directly via tool_use)

## What Gets Created/Modified

- `lib/claude/client.ts` — new module: `collectMatchData(query)` and `analyzeMatch(matchData)`
- `lib/claude/schemas.ts` — tool_use JSON schemas for MatchData and AnalysisReport
- `app/api/analyze/route.ts` — rewritten with 3-step pipeline

## SSE Events (unchanged format)

```typescript
{ type: 'id', id: string }
{ type: 'step', step: 'search' | 'collect' | 'analyze', message: string }
{ type: 'match_found', teamName: string, sport: string }
{ type: 'section', section: SectionName, data: object }
{ type: 'done', id: string }
{ type: 'error', message: string }
```

## Cost Estimate

Per report:
- Step 2 (Sonnet + web search): ~$0.02-0.05 (depends on search count)
- Step 3 (Sonnet analysis): ~$0.01-0.02
- Total: ~$0.03-0.07 per report

vs current pipeline:
- Sports API: free (100/day) or $10/mo
- Perplexity: ~$0.01-0.02
- Claude Haiku: ~$0.005
- Total: ~$0.015-0.025 + Sports API cost

## Risks

1. **Web search quality** — Claude may not find all data (especially niche leagues). Mitigation: prompt engineering, graceful fallback for missing fields.
2. **Cost per report higher** — ~2-3x more expensive per report. Acceptable for MVP.
3. **Speed** — web search adds latency. Expected 10-20 sec total vs 15 sec current. Acceptable.
4. **MatchData completeness** — some fields may be empty (xG, odds for minor leagues). UI already handles optional fields.
