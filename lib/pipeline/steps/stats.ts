import { MatchInfo, LeagueConfig, StatsData, DebugLog } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface StatsInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface StatsResult {
  data: StatsData;
  debugLogs: DebugLog[];
}

const STATS_LABELS: Record<string, string> = {
  position: "Место",
  points: "Очки",
  goalsFor: "Голы забитые",
  goalsAgainst: "Голы пропущенные",
  avgGoalsFor: "Ср. голов забито",
  avgGoalsAgainst: "Ср. голов пропущено",
  powerPlayPct: "Большинство %",
  penaltyKillPct: "Меньшинство %",
  penaltyMinutes: "Штраф. мин/игра",
  shotsPerGame: "Броски/игра",
};

export async function fetchStats(input: StatsInput): Promise<StatsResult> {
  const { match, leagueConfig } = input;

  const fields = leagueConfig.statsFields;
  const fieldsList = fields.map((f) => `- ${f}: ${STATS_LABELS[f] || f}`).join("\n");

  const jsonFormat = `{
  "team1": { ${fields.map((f) => `"${f}": значение`).join(", ")} },
  "team2": { ${fields.map((f) => `"${f}": значение`).join(", ")} }
}`;

  const prompt = `Статистика сезона ${leagueConfig.season} в ${leagueConfig.name} для команд ${match.team1} и ${match.team2}.

Нужны следующие показатели:
${fieldsList}

ВАЖНО:
- Числовые значения — числами (не строками)
- position — число (место в таблице)
- Проценты — числом (например 24.1, не "24.1%")
- Средние значения — с одним знаком после запятой
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь ТОЛЬКО JSON без обёртки, без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  const data = parseStats(raw, fields);

  return {
    data,
    debugLogs: [{ step: "Статистика", prompt, raw }],
  };
}

function parseStats(raw: string, fields: string[]): StatsData {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

  const team1: Record<string, string | number> = {};
  const team2: Record<string, string | number> = {};

  for (const field of fields) {
    const label = STATS_LABELS[field] || field;
    team1[label] = cleanValue(parsed.team1?.[field]);
    team2[label] = cleanValue(parsed.team2?.[field]);
  }

  return { team1, team2 };
}

function cleanValue(val: unknown): string | number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/\[\d+\]/g, "").replace(/%/g, "").trim();
    const num = Number(cleaned);
    return isNaN(num) ? cleaned : num;
  }
  return 0;
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (stats)");
}
