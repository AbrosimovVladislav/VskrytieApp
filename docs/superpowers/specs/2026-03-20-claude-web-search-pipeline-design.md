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
| Schema generation | Zod schemas → derive JSON Schema for tool_use | Single source of truth, no drift between TS types and API schemas |
| Fallback strategy | None (single vendor: Anthropic) | MVP trade-off, acceptable for now |

## Architecture

```
POST /api/analyze { query: string, sport: string }
        │
   Step 1: Validate (pure function, no API)
   Contract in:  { query: string, sport: string }
   Contract out: ValidatedQuery { query, sport }
   SSE: step="validate"
        │
   Step 2: Collect (Claude Sonnet + web_search tool)
   Contract in:  ValidatedQuery
   Contract out: MatchData (enforced via tool_use schema)
   SSE: step="collect"
   After completion: emit match_found + 6 section events (context, form, stats, injuries, context_factors, odds)
        │
   Step 3: Analyze (Claude Sonnet, no web search)
   Contract in:  MatchData
   Contract out: AnalysisReport (enforced via tool_use schema)
   SSE: step="analyze", then section="recommendation"
        │
   Save to Supabase → SSE: type="done"
```

## Contracts

### ValidatedQuery

```typescript
type ValidatedQuery = {
  query: string    // cleaned user input
  sport: 'football' | 'hockey' | 'basketball'
}
```

No `lang` field — prompts are always in Russian. `tennis` excluded (Post-MVP).

### MatchData (existing type, unchanged)

Source of truth: `lib/types/report.ts`. Remove `'tennis'` from `context.sport` union.

All fields with `?` are optional — Claude fills what it can find. **Minimum required fields** for pipeline to continue to Step 3:
- `context.homeTeam`, `context.awayTeam`, `context.sport`
- `form.home.last5`, `form.away.last5` (at least partial)

If minimum fields are missing, Step 2 returns error → SSE error event.

### AnalysisReport (existing type, unchanged)

Source of truth: `lib/types/report.ts`.

## Step Details

### Step 1: Validate

Pure function. Validates:
- `query` is non-empty string
- `sport` is one of `football | hockey | basketball`
- Returns `ValidatedQuery` or throws → SSE error

SSE: `{ type: 'step', step: 'validate', message: 'Проверяем запрос...' }`

### Step 2: Collect (Claude + web_search → MatchData)

Single Claude API call:
- **Model**: claude-sonnet-4-6
- **Tools**: `web_search` (Anthropic built-in) + `submit_match_data` (tool_use with MatchData JSON Schema derived from Zod)
- **max_tokens**: 16000 (web search responses can be large)
- **Prompt guidance**: "Make 5-8 web searches to find match data. Do not exceed 10 searches."
- **Output**: MatchData JSON, validated by Zod after extraction from tool_use response

The prompt instructs Claude to:
1. Find the next/upcoming match for the query
2. Search for recent form (last 5 results per team)
3. Search for H2H history
4. Search for injuries/suspensions
5. Search for betting odds
6. Search for context (weather, referee, transfers, motivation)
7. Call `submit_match_data` with all findings

**After Step 2 completes:**
- Validate MatchData against Zod schema (minimum fields check)
- Emit `{ type: 'match_found', teamName: matchData.context.homeTeam + ' vs ' + matchData.context.awayTeam, sport }`
- Emit 6 section events in sequence: context, form, stats, injuries, context_factors, odds (extracted from MatchData)

**Error handling:**
- Claude API error / timeout → SSE error, abort
- MatchData fails Zod validation (missing required fields) → SSE error, abort
- Partial data (optional fields missing) → continue, UI handles empty states

### Step 3: Analyze (Claude → AnalysisReport)

Single Claude API call:
- **Model**: claude-sonnet-4-6
- **Tools**: `submit_analysis` (tool_use with AnalysisReport JSON Schema derived from Zod)
- **max_tokens**: 4096
- **Input**: full MatchData JSON in user message
- **Output**: AnalysisReport JSON, validated by Zod

SSE: `{ type: 'step', step: 'analyze', message: 'Анализируем данные...' }`
After completion: emit `{ type: 'section', section: 'recommendation', data: analysisReport }`

**Error handling:**
- Claude API error → SSE error, abort
- AnalysisReport fails Zod validation → SSE error, abort

## SSE Events

```typescript
{ type: 'id', id: string }                                    // report created in Supabase
{ type: 'step', step: 'validate' | 'collect' | 'analyze', message: string }
{ type: 'match_found', teamName: string, sport: string }      // after Step 2
{ type: 'section', section: SectionName, data: object }        // 6 after Step 2, 1 after Step 3
{ type: 'done', id: string }
{ type: 'error', message: string }
```

## What Gets Removed

- `lib/sports-api/` — entire directory
- `lib/calculations/metrics.ts`
- `lib/openai/client.ts` — all Perplexity functions
- Sports API + Perplexity pipeline code in `app/api/analyze/route.ts`
- `'tennis'` from MatchData sport union

## What Stays

- `lib/types/report.ts` — MatchData, AnalysisReport, FullReport (minor: remove tennis)
- All `components/report/*` — UI unchanged
- Supabase save logic
- SSE streaming infrastructure

## What Gets Created

| File | Purpose |
|------|---------|
| `lib/claude/schemas.ts` | Zod schemas for MatchData + AnalysisReport → JSON Schema for tool_use |
| `lib/claude/client.ts` | `collectMatchData(query)` and `analyzeMatch(matchData)` |
| `lib/claude/prompts.ts` | Prompt templates for Step 2 and Step 3 |
| `app/api/analyze/route.ts` | Rewritten: 3-step pipeline |

## Supabase Storage

- `structured_report` (JSONB): FullReport = { matchData, analysis }
- `raw_stats` field: store raw Claude tool_use response for debugging (replaces Perplexity raw text)

## Cost Estimate

Per report: ~$0.03-0.07 (Sonnet × 2 + web search tokens)

## Risks

1. **Web search quality** — may miss data for niche leagues. Mitigation: prompt engineering, optional fields in UI.
2. **Single vendor** — no fallback if Anthropic is down. Acceptable for MVP.
3. **Cost** — ~2-3x current. Acceptable.
4. **Latency** — 10-20 sec expected. Similar to current.
5. **Search budget** — prompt limits to 5-8 searches to control cost/latency.
