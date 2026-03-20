import Anthropic from '@anthropic-ai/sdk'
import { MatchDataSchema, AnalysisReportSchema, matchDataJsonSchema, analysisReportJsonSchema } from './schemas'
import { collectPrompt, analyzePrompt } from './prompts'
import type { MatchData, AnalysisReport } from '@/lib/types/report'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'

/**
 * Step 2: Collect match data using Claude + web search.
 * Returns validated MatchData or throws.
 */
export async function collectMatchData(
  query: string,
  sport: string,
): Promise<MatchData> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [
      { role: 'user', content: collectPrompt(query, sport) },
    ],
    tools: [
      { type: 'web_search_20260209', name: 'web_search' },
      {
        name: 'submit_match_data',
        description: 'Submit the collected match data as structured JSON. Call this after gathering all data from web searches.',
        input_schema: matchDataJsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'any' },
  })

  // Extract the submit_match_data tool call from response
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'submit_match_data',
  )

  if (!toolUseBlock) {
    // If Claude used web_search but didn't call submit_match_data yet,
    // we need to continue the conversation
    const continueMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: collectPrompt(query, sport) },
      { role: 'assistant', content: response.content },
    ]

    // Build tool results for any server tool uses
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type === 'server_tool_use') {
        // Server tools are handled by Anthropic — we just need to continue
        continue
      }
    }

    // If stop_reason is pause_turn, we need to re-send to continue
    if (response.stop_reason === 'pause_turn') {
      const continueResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 16000,
        messages: continueMessages,
        tools: [
          { type: 'web_search_20260209', name: 'web_search' },
          {
            name: 'submit_match_data',
            description: 'Submit the collected match data as structured JSON. Call this after gathering all data from web searches.',
            input_schema: matchDataJsonSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: 'any' },
      })

      const retryBlock = continueResponse.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === 'tool_use' && block.name === 'submit_match_data',
      )

      if (!retryBlock) {
        throw new Error('Claude did not return match data after continuation')
      }

      const parsed = MatchDataSchema.parse(retryBlock.input)
      return parsed as MatchData
    }

    throw new Error('Claude did not call submit_match_data tool')
  }

  // Validate with Zod
  const parsed = MatchDataSchema.parse(toolUseBlock.input)
  return parsed as MatchData
}

/**
 * Step 3: Analyze match data using Claude (no web search).
 * Returns validated AnalysisReport or throws.
 */
export async function analyzeMatch(matchData: MatchData): Promise<AnalysisReport> {
  const response = await anthropic.messages.create({
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
