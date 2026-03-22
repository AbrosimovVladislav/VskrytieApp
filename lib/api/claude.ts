import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  return new Anthropic({ apiKey });
}

export async function claudeStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return JSON.parse(textBlock.text) as T;
}
