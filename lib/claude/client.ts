import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export { client as claude }

export async function callClaude(
  prompt: string,
  options?: {
    model?: string
    maxTokens?: number
    system?: string
  },
): Promise<string> {
  const response = await client.messages.create({
    model: options?.model ?? 'claude-sonnet-4-6',
    max_tokens: options?.maxTokens ?? 4096,
    system: options?.system,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text',
  )

  if (!textBlock) {
    throw new Error('Claude returned no text')
  }

  return textBlock.text
}
