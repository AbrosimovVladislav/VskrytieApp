import { MatchInfo, LeagueConfig, H2HData, DebugLog } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface H2HInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface H2HResult {
  data: H2HData;
  debugLogs: DebugLog[];
}

export async function fetchH2H(input: H2HInput): Promise<H2HResult> {
  const { match, leagueConfig } = input;

  const jsonFormat = `[
  { "date": "YYYY-MM-DD", "score": "Г:Г", "venue": "арена" }
]`;

  const prompt = `Последние 5 личных встреч между ${match.team1} и ${match.team2} в ${leagueConfig.name} (включая текущий и прошлый сезон).

Для каждого матча укажи:
- date: дата матча
- score: итоговый счёт в формате "голы_хозяев:голы_гостей"
- venue: арена/город проведения

ВАЖНО:
- До 5 матчей, от самого свежего к старому
- Счёт — финальный (включая овертайм/буллиты если были)
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь ТОЛЬКО массивом JSON без обёртки, без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  const games = parseH2HGames(raw);

  return {
    data: { games },
    debugLogs: [{ step: "H2H", prompt, raw }],
  };
}

function parseH2HGames(raw: string): H2HData["games"] {
  const jsonStr = extractJsonArray(raw);
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) return [];

  return parsed.slice(0, 5).map((g: Record<string, unknown>) => ({
    date: clean(g.date as string) || "",
    score: clean(g.score as string) || "0:0",
    venue: clean(g.venue as string) || "",
  }));
}

function clean(value: string | undefined): string {
  if (!value) return "";
  return String(value).replace(/\[\d+\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function extractJsonArray(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return `[${objMatch[0]}]`;

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (h2h)");
}
