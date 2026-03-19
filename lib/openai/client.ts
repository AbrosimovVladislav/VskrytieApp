import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function fetchMatchStats(query: string): Promise<string> {
  const response = await openai.responses.create({
    model: 'gpt-4o-search-preview',
    tools: [{ type: 'web_search_preview' }],
    input: `Найди актуальную статистику и последние новости для ставок: ${query}.
Нужно: текущая форма команд, личные встречи, травмы/дисквалификации, аналитика букмекеров, коэффициенты.
Отвечай на русском языке, кратко и по делу.`,
  })

  return response.output_text
}
