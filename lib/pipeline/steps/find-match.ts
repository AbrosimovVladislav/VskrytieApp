import { MatchInfo, MatchClarification, LeagueConfig } from "@/types/pipeline";
import { queryPerplexity } from "@/lib/perplexity/client";

interface FindMatchInput {
  query: string;
  sport: string;
  leagueConfig: LeagueConfig;
}

export type FindMatchResult =
  | { found: true; match: MatchInfo }
  | { found: false; clarification: MatchClarification };

export async function findMatch(input: FindMatchInput): Promise<FindMatchResult> {
  const prompt = buildPrompt(input);
  const raw = await queryPerplexity(prompt);
  return parseResponse(raw, input.leagueConfig);
}

function buildPrompt(input: FindMatchInput): string {
  return `Какой ближайший матч ${input.query} в ${input.leagueConfig.name} сезона ${input.leagueConfig.season}?
Дата, время (московское), соперник, место проведения.

Ответь строго в JSON формате без markdown:
{
  "found": true/false,
  "team1": "название команды 1",
  "team2": "название команды 2",
  "date": "YYYY-MM-DD",
  "time": "HH:MM МСК",
  "venue": "название арены",
  "message": "если не найден — объяснение почему",
  "suggestions": ["вариант 1", "вариант 2"]
}

Если нашёл конкретный матч — found: true, заполни team1, team2, date, time, venue.
Если не удалось определить — found: false, заполни message и suggestions (варианты уточнения).`;
}

function parseResponse(raw: string, leagueConfig: LeagueConfig): FindMatchResult {
  const jsonStr = extractJson(raw);
  const data = JSON.parse(jsonStr);

  if (data.found) {
    return {
      found: true,
      match: {
        team1: data.team1,
        team2: data.team2,
        date: data.date,
        time: data.time,
        venue: data.venue,
        league: leagueConfig.name,
      },
    };
  }

  return {
    found: false,
    clarification: {
      message: data.message || "Не удалось найти матч. Уточните запрос.",
      suggestions: data.suggestions,
    },
  };
}

function extractJson(text: string): string {
  // Try to find JSON in code blocks first
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity");
}
