const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export async function queryPerplexity(prompt: string): Promise<string> {
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
