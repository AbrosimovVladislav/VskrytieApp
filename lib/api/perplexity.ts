import OpenAI from "openai";

function getClient(): OpenAI {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY is not set");

  return new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });
}

export async function perplexityQuery(prompt: string): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "sonar",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Perplexity returned empty response");

  return content;
}
