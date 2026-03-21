import { MatchInfo, LeagueConfig, OddsData, DebugLog } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface OddsInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

interface OddsResult {
  data: OddsData;
  debugLogs: DebugLog[];
}

export async function fetchOdds(input: OddsInput): Promise<OddsResult> {
  const { match, leagueConfig } = input;

  const bkList = leagueConfig.bookmakers.join(", ");

  const jsonFormat = `[
  {
    "name": "БК",
    "outcome_home": 2.10,
    "outcome_draw": 3.40,
    "outcome_away": 3.15,
    "total_over": 1.85,
    "total_under": 1.95
  }
]`;

  const prompt = `Букмекерские коэффициенты на матч ${match.team1} vs ${match.team2}, ${leagueConfig.name}, ${match.date}.

Нужны коэффициенты от следующих букмекеров: ${bkList}

Для каждого букмекера укажи:
- name: название БК
- outcome_home: коэффициент на победу хозяев (в основное время для хоккея)
- outcome_draw: коэффициент на ничью (в основное время)
- outcome_away: коэффициент на победу гостей (в основное время)
- total_over: коэффициент на тотал больше (основная линия)
- total_under: коэффициент на тотал меньше (основная линия)

ВАЖНО:
- Коэффициенты — числа с двумя знаками (например 2.10, не "2.10")
- Если точных данных нет — дай приблизительные на основе доступной информации
- НЕ добавляй ссылки в квадратных скобках типа [1], [2]
- Ответь ТОЛЬКО массивом JSON без обёртки, без markdown:
${jsonFormat}`;

  const raw = await queryPerplexity(prompt);
  const bookmakers = parseOdds(raw);

  return {
    data: { bookmakers },
    debugLogs: [{ step: "Коэффициенты", prompt, raw }],
  };
}

function parseOdds(raw: string): OddsData["bookmakers"] {
  const jsonStr = extractJsonArray(raw);
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) return [];

  return parsed.map((b: Record<string, unknown>) => ({
    name: clean(b.name as string) || "БК",
    outcome_home: toNum(b.outcome_home),
    outcome_draw: toNum(b.outcome_draw),
    outcome_away: toNum(b.outcome_away),
    total_over: toNum(b.total_over),
    total_under: toNum(b.total_under),
  }));
}

function toNum(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const num = parseFloat(val.replace(/\[\d+\]/g, "").trim());
    return isNaN(num) ? 0 : num;
  }
  return 0;
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

  throw new Error("Не удалось извлечь JSON из ответа Perplexity (odds)");
}
