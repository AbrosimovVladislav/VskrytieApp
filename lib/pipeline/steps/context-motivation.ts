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
    "position": "позиция в таблице (например: 5-е место, Западная конференция)",
    "fighting_for": "за что борется (плей-офф, лидерство, выживание и т.д.)",
    "priority": "приоритет матча для команды"
  },
  "team2": {
    "position": "...",
    "fighting_for": "...",
    "priority": "..."
  },
  "stage": "стадия сезона (например: Регулярный сезон, финальная треть)"
}`;

  const prompt = `Матч ${match.team1} vs ${match.team2}, ${leagueConfig.name}, ${match.date}.
Какое турнирное положение каждой команды?
За что борется каждая (плей-офф, место в таблице, вылет)?
Какая стадия сезона?
Какой приоритет этого матча для каждой?

Ответь строго в JSON без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  return parseMotivationResponse(raw);
}

function parseMotivationResponse(raw: string): MotivationData {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    team1: {
      position: parsed.team1?.position || "Нет данных",
      fighting_for: parsed.team1?.fighting_for || "Нет данных",
      priority: parsed.team1?.priority || "Нет данных",
    },
    team2: {
      position: parsed.team2?.position || "Нет данных",
      fighting_for: parsed.team2?.fighting_for || "Нет данных",
      priority: parsed.team2?.priority || "Нет данных",
    },
    stage: parsed.stage || "Нет данных",
  };
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (context-motivation)");
}
