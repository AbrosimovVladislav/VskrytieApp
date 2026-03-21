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
  { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": true, "overtime": false },
  { "date": "YYYY-MM-DD", "opponent": "соперник", "score": "Г:Г", "home": false, "overtime": true }
]`;

  const prompt = `Последние 5 сыгранных матчей команды ${teamName} в ${leagueConfig.name} сезона ${leagueConfig.season}.

Для каждого матча укажи:
- date: дата матча
- opponent: название соперника
- score: счёт с точки зрения ${teamName} (сначала голы ${teamName}, потом голы соперника), формат "Г:Г"
- home: true если ${teamName} играл дома, false если на выезде
- overtime: true если матч завершился в овертайме или по буллитам, false если в основное время

ВАЖНО:
- Ровно 5 матчей, от самого свежего к старому
- Счёт ВСЕГДА с точки зрения ${teamName}: первое число — голы ${teamName}
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

  return parsed.slice(0, 5).map((g: Record<string, unknown>) => {
    const score = clean(g.score as string) || "0:0";
    const overtime = Boolean(g.overtime);
    const result = computeResult(score, overtime);

    return {
      date: clean(g.date as string) || "",
      opponent: clean(g.opponent as string) || "",
      score,
      home: Boolean(g.home),
      result,
    };
  });
}

/** Вычисляем результат по счёту (счёт с точки зрения команды: "голы_команды:голы_соперника") */
function computeResult(score: string, overtime: boolean): GameResult["result"] {
  const parts = score.split(":").map((s) => parseInt(s.trim(), 10));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return "W";

  const [goalsFor, goalsAgainst] = parts;

  if (goalsFor > goalsAgainst) {
    return overtime ? "OTW" : "W";
  } else {
    return overtime ? "OTL" : "L";
  }
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
