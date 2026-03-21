import { MatchInfo, LeagueConfig, MotivationData } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface ContextMotivationInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchContextMotivation(
  input: ContextMotivationInput
): Promise<MotivationData> {
  const { match, leagueConfig } = input;

  const jsonFormat = `{
  "team1": {
    "position": "место в таблице, конференция",
    "fighting_for": "за что борется, коротко",
    "priority": "высокий/средний/низкий — почему, коротко"
  },
  "team2": {
    "position": "...",
    "fighting_for": "...",
    "priority": "..."
  },
  "stage": "стадия сезона, коротко"
}`;

  const prompt = `Матч ${match.team1} vs ${match.team2}, ${leagueConfig.name}, ${match.date}.

Дай краткую информацию о турнирном положении каждой команды:
- Место в таблице
- За что борется
- Приоритет этого матча
- Стадия сезона

ВАЖНО:
- Пиши КРАТКО, без развёрнутых пояснений
- НЕ добавляй ссылки в квадратных скобках типа [1], [2] и т.д.
- Ответь строго в JSON без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  return parseMotivationResponse(raw);
}

function parseMotivationResponse(raw: string): MotivationData {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    team1: {
      position: clean(parsed.team1?.position),
      fighting_for: clean(parsed.team1?.fighting_for),
      priority: clean(parsed.team1?.priority),
    },
    team2: {
      position: clean(parsed.team2?.position),
      fighting_for: clean(parsed.team2?.fighting_for),
      priority: clean(parsed.team2?.priority),
    },
    stage: clean(parsed.stage),
  };
}

/** Remove Perplexity citation references like [1], [3][5] */
function clean(value: string | undefined): string {
  if (!value) return "Нет данных";
  return value.replace(/\[\d+\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (context-motivation)");
}
