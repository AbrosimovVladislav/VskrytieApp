import { MatchContextSchema, MatchStatsSchema, MatchContextFactorsSchema } from '@/lib/claude/schemas'
import { identifyMatchPrompt, collectStatsPrompt, collectContextPrompt } from './prompts'
import type { MatchData } from '@/lib/types/report'
import { z } from 'zod'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

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

// ── Step 1: Identify match ──

export async function identifyMatch(
  query: string,
  sport: string,
): Promise<z.infer<typeof MatchContextSchema>> {
  console.log('[perplexity] Step 1: identifying match')
  const content = await queryPerplexity(identifyMatchPrompt(query, sport))
  const result = parseJson(content, MatchContextSchema)
  console.log('[perplexity] Match identified:', result.homeTeam, 'vs', result.awayTeam, '-', result.competition, result.round)
  return result
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
