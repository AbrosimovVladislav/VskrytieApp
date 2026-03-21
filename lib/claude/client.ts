import Anthropic from '@anthropic-ai/sdk'
import { AnalysisReportSchema, analysisReportJsonSchema } from './schemas'
import { analyzePrompt } from './prompts'
import type { MatchData, AnalysisReport } from '@/lib/types/report'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'

/**
 * Analyze match data using Claude (no web search, streaming).
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
