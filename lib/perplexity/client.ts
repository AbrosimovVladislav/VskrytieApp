import { MatchDataSchema } from '@/lib/claude/schemas'
import { collectPrompt } from './prompts'
import type { MatchData } from '@/lib/types/report'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export async function collectMatchData(
  query: string,
  sport: string,
): Promise<MatchData> {
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
        { role: 'user', content: collectPrompt(query, sport) },
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

  // Extract JSON from response (may have markdown wrapping)
  const jsonStr = extractJson(content)
  const parsed = JSON.parse(jsonStr)
  const validated = MatchDataSchema.parse(parsed)
  return validated as MatchData
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
