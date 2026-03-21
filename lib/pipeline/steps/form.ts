import { MatchInfo, LeagueConfig, FormData, GameResult } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface FormInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchForm(input: FormInput): Promise<FormData> {
  const { match, leagueConfig } = input;

  const jsonFormat = `{
  "team1_last5": [
    { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": true, "result": "W" }
  ],
  "team2_last5": [
    { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": false, "result": "L" }
  ]
}`;

  const prompt = `Последние 5 сыгранных матчей команды ${match.team1} и последние 5 сыгранных матчей команды ${match.team2} в ${leagueConfig.name} сезона ${leagueConfig.season}.

Для каждого матча укажи: дату, соперника, счёт, дома или на выезде, результат.

Поле result:
- "W" — победа в основное время
- "L" — поражение в основное время
- "OTW" — победа в овертайме/по буллитам
- "OTL" — поражение в овертайме/по буллитам

ВАЖНО:
- Ровно 5 матчей на каждую команду, от самого свежего к старому
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь строго в JSON без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  return parseFormResponse(raw);
}

function parseFormResponse(raw: string): FormData {
  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    team1_last5: parseGames(parsed.team1_last5),
    team2_last5: parseGames(parsed.team2_last5),
  };
}

function parseGames(games: unknown): GameResult[] {
  if (!Array.isArray(games)) return [];

  return games.slice(0, 5).map((g) => ({
    date: clean(g.date) || "",
    opponent: clean(g.opponent) || "",
    score: clean(g.score) || "",
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

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (form)");
}
