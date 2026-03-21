import { MatchInfo, LeagueConfig, SquadContextData, DebugLog } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface SquadContextInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface SquadContextResult {
  data: SquadContextData;
  debugLogs: DebugLog[];
}

export async function fetchSquadContext(
  input: SquadContextInput
): Promise<SquadContextResult> {
  const { match, leagueConfig } = input;

  const jsonFormat = `{
  "team1": {
    "injuries": "травмы и дисквалификации, коротко",
    "media_summary": "ключевые новости и мнения, коротко",
    "rotation_expected": "ожидается ли ротация состава, коротко"
  },
  "team2": {
    "injuries": "...",
    "media_summary": "...",
    "rotation_expected": "..."
  }
}`;

  const prompt = `Кадровая ситуация и контекст перед матчем ${match.team1} vs ${match.team2}, ${leagueConfig.name}, ${match.date}.

Для каждой команды укажи:
- injuries: текущие травмы, дисквалификации ключевых игроков
- media_summary: что пишут СМИ, ключевые факты перед матчем
- rotation_expected: ожидается ли ротация состава и почему

ВАЖНО:
- Пиши КРАТКО, 1-2 предложения на каждый пункт
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь ТОЛЬКО JSON без обёртки, без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  const data = parseSquadContext(raw);

  return {
    data,
    debugLogs: [{ step: "Кадры", prompt, raw }],
  };
}

function parseSquadContext(raw: string): SquadContextData {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    team1: {
      injuries: clean(parsed.team1?.injuries),
      media_summary: clean(parsed.team1?.media_summary),
      rotation_expected: clean(parsed.team1?.rotation_expected),
    },
    team2: {
      injuries: clean(parsed.team2?.injuries),
      media_summary: clean(parsed.team2?.media_summary),
      rotation_expected: clean(parsed.team2?.rotation_expected),
    },
  };
}

function clean(value: string | undefined): string {
  if (!value) return "Нет данных";
  return value.replace(/\[\d+\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (squad-context)");
}
