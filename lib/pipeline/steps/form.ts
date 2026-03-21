import { MatchInfo, LeagueConfig, FormData, GameResult } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface FormInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchForm(input: FormInput): Promise<FormData> {
  const { match, leagueConfig } = input;

  const [team1Games, team2Games] = await Promise.all([
    fetchTeamForm(match.team1, leagueConfig),
    fetchTeamForm(match.team2, leagueConfig),
  ]);

  return {
    team1_last5: team1Games,
    team2_last5: team2Games,
  };
}

async function fetchTeamForm(
  teamName: string,
  leagueConfig: LeagueConfig
): Promise<GameResult[]> {
  const jsonFormat = `[
  { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": true, "result": "W" },
  { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": false, "result": "L" }
]`;

  const prompt = `Последние 5 сыгранных матчей команды ${teamName} в ${leagueConfig.name} сезона ${leagueConfig.season}.

Для каждого матча укажи: дату, соперника, счёт, дома или на выезде, результат.

Поле result:
- "W" — победа в основное время
- "L" — поражение в основное время
- "OTW" — победа в овертайме/по буллитам
- "OTL" — поражение в овертайме/по буллитам

ВАЖНО:
- Ровно 5 матчей, от самого свежего к старому
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь ТОЛЬКО массивом JSON без обёртки, без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  console.log(`[form] ${teamName} raw:`, raw.substring(0, 500));
  return parseGames(raw);
}

function parseGames(raw: string): GameResult[] {
  const jsonStr = extractJsonArray(raw);
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) return [];

  return parsed.slice(0, 5).map((g: Record<string, unknown>) => ({
    date: clean(g.date as string) || "",
    opponent: clean(g.opponent as string) || "",
    score: clean(g.score as string) || "",
    home: Boolean(g.home),
    result: parseResult(g.result),
  }));
}

function parseResult(r: unknown): GameResult["result"] {
  const val = String(r).toUpperCase();
  if (val === "W" || val === "L" || val === "OTW" || val === "OTL") return val;
  return "W";
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

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (form)");
}
