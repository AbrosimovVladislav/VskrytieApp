import { MatchContextSchema, MatchStatsSchema, MatchContextFactorsSchema, MatchReviewResultSchema, matchReviewJsonSchema } from '@/lib/claude/schemas'
import {
  identifyMatchDirectPrompt,
  identifyMatchSchedulePrompt,
  identifyMatchNewsPrompt,
  identifyMatchRefinementPrompt,
  reviewMatchResultsPrompt,
  collectStatsPrompt,
  collectContextPrompt,
} from './prompts'
import type { MatchData } from '@/lib/types/report'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function queryPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not set')
  }

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Perplexity API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content: string = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Perplexity returned empty response')
  }

  return content
}

function parseJson<T>(content: string, schema: z.ZodType<T>): T {
  const jsonStr = extractJson(content)
  const parsed = JSON.parse(jsonStr)
  return schema.parse(parsed)
}

// Try to parse, return null on failure
function tryParseJson<T>(content: string, schema: z.ZodType<T>): T | null {
  try {
    return parseJson(content, schema)
  } catch {
    return null
  }
}

// ── Step 1: Multi-agent match identification ──

type SearchCandidate = {
  source: string
  result: z.infer<typeof MatchContextSchema> | null
  error?: string
}

async function searchAgent(
  name: string,
  prompt: string,
): Promise<SearchCandidate> {
  try {
    const content = await queryPerplexity(prompt)
    const result = tryParseJson(content, MatchContextSchema)
    if (result && isTBD(result)) {
      return { source: name, result: null, error: 'Result contains TBD/unknown team' }
    }
    return { source: name, result }
  } catch (err) {
    return { source: name, result: null, error: err instanceof Error ? err.message : String(err) }
  }
}

function isTBD(result: z.infer<typeof MatchContextSchema>): boolean {
  const tbd = /^(tbd|tbа|неизвестн|определится|—|-|\.{2,}|\?)$/i
  return tbd.test(result.homeTeam.trim()) || tbd.test(result.awayTeam.trim())
}

type ReviewResult = z.infer<typeof MatchReviewResultSchema>

async function reviewWithClaude(
  query: string,
  sport: string,
  candidates: SearchCandidate[],
): Promise<ReviewResult> {
  const valid = candidates.filter(c => c.result != null)

  // No valid candidates — low confidence, nothing to review
  if (valid.length === 0) {
    return {
      confidence: 'low',
      match: null,
      conflictSummary: candidates.map(c => `${c.source}: ${c.error ?? 'parse failed'}`).join('; '),
    }
  }

  // Only one valid candidate — still review for TBD/quality but likely accept
  // All candidates agree on both teams — high confidence, skip Claude call
  if (valid.length >= 2) {
    const teams = valid.map(c => `${c.result!.homeTeam}|${c.result!.awayTeam}`)
    const allSame = teams.every(t => t === teams[0])
    if (allSame) {
      console.log('[identify] All', valid.length, 'agents agree — skipping Claude review')
      return { confidence: 'high', match: valid[0].result! }
    }
  }

  console.log('[identify] Reviewing', valid.length, 'candidates with Claude')

  const reviewPrompt = reviewMatchResultsPrompt(
    query,
    sport,
    candidates.map(c => ({
      source: c.source,
      result: c.result as Record<string, unknown> | null,
      error: c.error,
    })),
  )

  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: reviewPrompt }],
    tools: [{
      name: 'submit_review',
      description: 'Submit match review with confidence level.',
      input_schema: matchReviewJsonSchema as Anthropic.Tool.InputSchema,
    }],
    tool_choice: { type: 'tool', name: 'submit_review' },
  })

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_review',
  )

  if (!toolBlock) {
    throw new Error('Claude reviewer did not call submit_review')
  }

  return MatchReviewResultSchema.parse(toolBlock.input)
}

const MAX_ROUNDS = 2

export async function identifyMatch(
  query: string,
  sport: string,
  onProgress?: (message: string) => void,
): Promise<z.infer<typeof MatchContextSchema>> {
  let allCandidates: SearchCandidate[] = []

  // ── Round 1: 3 parallel search agents ──
  console.log('[identify] Round 1: 3 parallel search agents for:', query)
  onProgress?.('Ищем матч (3 агента)...')

  const round1 = await Promise.all([
    searchAgent('direct', identifyMatchDirectPrompt(query, sport)),
    searchAgent('schedule', identifyMatchSchedulePrompt(query, sport)),
    searchAgent('news', identifyMatchNewsPrompt(query, sport)),
  ])

  allCandidates.push(...round1)
  logCandidates(round1, 1)

  const review1 = await reviewWithClaude(query, sport, allCandidates)
  console.log('[identify] Round 1 confidence:', review1.confidence)

  if (review1.confidence === 'high' && review1.match) {
    console.log('[identify] Final:', review1.match.homeTeam, 'vs', review1.match.awayTeam)
    return review1.match
  }

  // ── Round 2: 3 more agents with refined prompts ──
  console.log('[identify] Low confidence, starting round 2')
  onProgress?.('Уточняем результаты (ещё 3 агента)...')

  const previousResults = allCandidates
    .filter(c => c.result)
    .map(c => `${c.source}: ${c.result!.homeTeam} vs ${c.result!.awayTeam}, ${c.result!.date}, ${c.result!.competition}`)
    .join('\n')

  const conflict = review1.conflictSummary ?? 'Результаты агентов расходятся'

  const round2 = await Promise.all([
    searchAgent('refine-1', identifyMatchRefinementPrompt(query, sport, previousResults, conflict)),
    searchAgent('refine-2', identifyMatchRefinementPrompt(query + ' расписание', sport, previousResults, conflict)),
    searchAgent('refine-3', identifyMatchRefinementPrompt(query + ' следующий матч', sport, previousResults, conflict)),
  ])

  allCandidates.push(...round2)
  logCandidates(round2, 2)

  const review2 = await reviewWithClaude(query, sport, allCandidates)
  console.log('[identify] Round 2 confidence:', review2.confidence)

  if (review2.match) {
    console.log('[identify] Final:', review2.match.homeTeam, 'vs', review2.match.awayTeam)
    return review2.match
  }

  // Last resort: take the best valid candidate even with low confidence
  const anyValid = allCandidates.find(c => c.result != null)
  if (anyValid?.result) {
    console.log('[identify] Fallback to best available:', anyValid.result.homeTeam, 'vs', anyValid.result.awayTeam)
    return anyValid.result
  }

  throw new Error(`Failed to identify match after ${MAX_ROUNDS} rounds. Conflicts: ${review2.conflictSummary}`)
}

function logCandidates(candidates: SearchCandidate[], round: number) {
  for (const c of candidates) {
    if (c.result) {
      console.log(`[identify] R${round} ${c.source}: ${c.result.homeTeam} vs ${c.result.awayTeam} (${c.result.competition}, ${c.result.round})`)
    } else {
      console.log(`[identify] R${round} ${c.source}: FAILED —`, c.error)
    }
  }
}

// ── Step 2: Collect stats, form, H2H, odds ──

export async function collectStats(
  ctx: z.infer<typeof MatchContextSchema>,
): Promise<z.infer<typeof MatchStatsSchema>> {
  console.log('[perplexity] Step 2: collecting stats')
  const content = await queryPerplexity(
    collectStatsPrompt(ctx.homeTeam, ctx.awayTeam, ctx.competition, ctx.round, ctx.date, ctx.sport),
  )
  return parseJson(content, MatchStatsSchema)
}

// ── Step 3: Collect context factors ──

export async function collectContext(
  ctx: z.infer<typeof MatchContextSchema>,
): Promise<z.infer<typeof MatchContextFactorsSchema>> {
  console.log('[perplexity] Step 3: collecting context')
  const content = await queryPerplexity(
    collectContextPrompt(ctx.homeTeam, ctx.awayTeam, ctx.competition, ctx.round, ctx.date, ctx.sport),
  )
  return parseJson(content, MatchContextFactorsSchema)
}

// ── Full pipeline: 3 steps (step 1 → steps 2+3 parallel) → MatchData ──

export async function collectMatchData(
  query: string,
  sport: string,
): Promise<MatchData> {
  // Step 1: identify match
  const matchContext = await identifyMatch(query, sport)

  // Steps 2+3 in parallel
  const [statsData, contextData] = await Promise.all([
    collectStats(matchContext),
    collectContext(matchContext),
  ])

  // Assemble MatchData
  const matchData: MatchData = {
    context: {
      ...matchContext,
      motivation: contextData.motivation,
    },
    form: statsData.form,
    h2h: statsData.h2h,
    stats: statsData.stats,
    injuries: contextData.injuries,
    contextFactors: contextData.contextFactors,
    odds: statsData.odds,
  }

  return matchData
}

function extractJson(text: string): string {
  // Try to find JSON block in markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to find raw JSON object
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1)
  }

  return text.trim()
}
