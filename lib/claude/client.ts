import Anthropic from '@anthropic-ai/sdk'
import { MatchDataSchema, AnalysisReportSchema, matchDataJsonSchema, analysisReportJsonSchema } from './schemas'
import { collectPrompt, analyzePrompt } from './prompts'
import type { MatchData, AnalysisReport } from '@/lib/types/report'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_CONTINUATIONS = 3

function findSubmitBlock(content: Anthropic.ContentBlock[]): Anthropic.ToolUseBlock | undefined {
  return content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'submit_match_data',
  )
}

/**
 * Step 2: Collect match data using Claude + web search (streaming).
 */
export async function collectMatchData(
  query: string,
  sport: string,
): Promise<MatchData> {
  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: 'web_search_20260209', name: 'web_search' },
    {
      name: 'submit_match_data',
      description: 'Submit the collected match data as structured JSON. Call this after gathering all data from web searches.',
      input_schema: matchDataJsonSchema as Anthropic.Tool.InputSchema,
    },
  ]

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: collectPrompt(query, sport) },
  ]

  // Use streaming to avoid HTTP timeouts
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    messages,
    tools,
    tool_choice: { type: 'any' },
  })
  let response = await stream.finalMessage()

  // Loop to handle pause_turn (server-side web search may need continuations)
  for (let i = 0; i < MAX_CONTINUATIONS; i++) {
    const submitBlock = findSubmitBlock(response.content)
    if (submitBlock) {
      const parsed = MatchDataSchema.parse(submitBlock.input)
      return parsed as MatchData
    }

    if (response.stop_reason !== 'pause_turn') {
      break
    }

    // Continue: append assistant content and re-send
    messages.push({ role: 'assistant', content: response.content })

    console.log(`[collect] pause_turn, continuing (${i + 1}/${MAX_CONTINUATIONS})`)
    const continueStream = client.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      messages,
      tools,
      tool_choice: { type: 'any' },
    })
    response = await continueStream.finalMessage()
  }

  // Final check after loop
  const finalBlock = findSubmitBlock(response.content)
  if (finalBlock) {
    const parsed = MatchDataSchema.parse(finalBlock.input)
    return parsed as MatchData
  }

  throw new Error(
    `Claude did not call submit_match_data after ${MAX_CONTINUATIONS} continuations. ` +
    `Last stop_reason: ${response.stop_reason}`
  )
}

/**
 * Step 3: Analyze match data using Claude (no web search, streaming).
 */
export async function analyzeMatch(matchData: MatchData): Promise<AnalysisReport> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${analyzePrompt()}\n\nДанные матча:\n${JSON.stringify(matchData, null, 2)}`,
      },
    ],
    tools: [
      {
        name: 'submit_analysis',
        description: 'Submit the analysis report as structured JSON.',
        input_schema: analysisReportJsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_analysis' },
  })

  const response = await stream.finalMessage()

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'submit_analysis',
  )

  if (!toolUseBlock) {
    throw new Error('Claude did not call submit_analysis tool')
  }

  const parsed = AnalysisReportSchema.parse(toolUseBlock.input)
  return parsed as AnalysisReport
}
