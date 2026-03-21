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

interface RawMatchCandidate {
  found: boolean;
  team1?: string;
  team2?: string;
  date?: string;
  time?: string;
  venue?: string;
  message?: string;
  suggestions?: string[];
}

export async function findMatch(input: FindMatchInput): Promise<FindMatchResult> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const nowMsk = getMskTime(now);

  // Round 1: 3 parallel agents with different prompts
  const candidates = await runParallelSearch(input, today, nowMsk);

  // Filter: only complete matches that haven't started yet
  const valid = candidates.filter(
    (c) =>
      c.found &&
      c.team1 &&
      c.team2 &&
      c.date &&
      c.time &&
      isMatchInFuture(c.date, c.time, today, nowMsk)
  );

  if (valid.length > 0) {
    // Verify with AI which candidate is best
    const best = await verifyBestMatch(valid, input, today);
    if (best) {
      return {
        found: true,
        match: {
          team1: best.team1!,
          team2: best.team2!,
          date: best.date!,
          time: best.time!,
          venue: best.venue || "",
          league: input.leagueConfig.name,
        },
      };
    }
  }

  // Round 2: retry with stricter prompt if round 1 failed
  const retryCandidate = await retrySearch(input, today, nowMsk);
  if (retryCandidate && retryCandidate.found && retryCandidate.team1 && retryCandidate.team2 && retryCandidate.date && retryCandidate.time && isMatchInFuture(retryCandidate.date, retryCandidate.time, today, nowMsk)) {
    return {
      found: true,
      match: {
        team1: retryCandidate.team1!,
        team2: retryCandidate.team2!,
        date: retryCandidate.date!,
        time: retryCandidate.time!,
        venue: retryCandidate.venue || "",
        league: input.leagueConfig.name,
      },
    };
  }

  // Nothing found — collect suggestions from all candidates
  const allSuggestions = candidates
    .flatMap((c) => c.suggestions || [])
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 5);

  const message = candidates.find((c) => c.message)?.message
    || "Не удалось найти предстоящий матч. Уточните запрос.";

  return {
    found: false,
    clarification: { message, suggestions: allSuggestions },
  };
}

async function runParallelSearch(
  input: FindMatchInput,
  today: string,
  nowMsk: string
): Promise<RawMatchCandidate[]> {
  const { query, leagueConfig } = input;
  const league = leagueConfig.name;
  const season = leagueConfig.season;

  const jsonFormat = `{
  "found": true/false,
  "team1": "команда хозяев",
  "team2": "команда гостей",
  "date": "YYYY-MM-DD",
  "time": "HH:MM МСК",
  "venue": "арена",
  "message": "если не найден — почему",
  "suggestions": ["вариант 1", "вариант 2"]
}`;

  const timeNote = `Сегодня ${today}, сейчас ${nowMsk} МСК. Матч подходит ТОЛЬКО если он ещё НЕ начался. Матчи в прошлом и уже идущие НЕ подходят.`;
  const requireBoth = `ОБЯЗАТЕЛЬНО укажи ОБЕ команды (team1 — хозяева, team2 — гости). Если не можешь определить соперника — ставь found: false.`;

  const prompts = [
    // Agent 1: Direct schedule search
    `${timeNote}
Найди ближайший ПРЕДСТОЯЩИЙ матч "${query}" в ${league} сезона ${season}.
${requireBoth}
Нужны: команда хозяев, команда гостей, дата, время (МСК), арена.
Ответь строго в JSON без markdown:
${jsonFormat}`,

    // Agent 2: Calendar/schedule focused
    `${timeNote}
Посмотри расписание/календарь ${league} сезона ${season}.
Какой следующий матч с участием "${query}" который ещё НЕ начался?
${requireBoth}
Ответь строго в JSON без markdown:
${jsonFormat}`,

    // Agent 3: News/announcements focused
    `${timeNote}
Какой ближайший предстоящий матч команды "${query}" в лиге ${league} (сезон ${season})?
${requireBoth}
Ищи в новостях, анонсах, расписании. Если матч уже состоялся или идёт прямо сейчас — ищи следующий.
Ответь строго в JSON без markdown:
${jsonFormat}`,
  ];

  const results = await Promise.allSettled(
    prompts.map((p) => queryPerplexity(p))
  );

  const candidates: RawMatchCandidate[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      try {
        const parsed = parseRawResponse(r.value);
        candidates.push(parsed);
      } catch {
        // Skip unparseable responses
      }
    }
  }

  return candidates;
}

async function verifyBestMatch(
  candidates: RawMatchCandidate[],
  input: FindMatchInput,
  today: string
): Promise<RawMatchCandidate | null> {
  if (candidates.length === 1) return candidates[0];

  // Multiple candidates — ask AI to pick the best one
  const candidateList = candidates
    .map((c, i) => `${i + 1}) ${c.team1} vs ${c.team2}, ${c.date}, ${c.time}, ${c.venue}`)
    .join("\n");

  const prompt = `Сегодня ${today}. Пользователь искал: "${input.query}" в лиге ${input.leagueConfig.name}.
Найдено несколько вариантов предстоящих матчей:
${candidateList}

Какой вариант наиболее подходящий? Выбери номер. Ответь строго JSON:
{"pick": 1}

Критерии: матч должен быть в будущем (>= ${today}), ближайший по дате, соответствовать запросу пользователя.`;

  try {
    const raw = await queryPerplexity(prompt);
    const json = JSON.parse(extractJson(raw));
    const pick = json.pick;
    if (typeof pick === "number" && pick >= 1 && pick <= candidates.length) {
      return candidates[pick - 1];
    }
  } catch {
    // Fallback: pick earliest future match
  }

  // Fallback: sort by date, pick earliest
  return candidates.sort((a, b) => (a.date! > b.date! ? 1 : -1))[0];
}

async function retrySearch(
  input: FindMatchInput,
  today: string,
  nowMsk: string
): Promise<RawMatchCandidate | null> {
  const prompt = `Сегодня ${today}, сейчас ${nowMsk} МСК. Я НЕ СМОГ найти предстоящий матч "${input.query}" в ${input.leagueConfig.name} сезона ${input.leagueConfig.season}.
Попробуй ещё раз. Проверь расписание, календарь, анонсы матчей.
Матч ОБЯЗАТЕЛЬНО должен быть в будущем и ещё НЕ начавшимся.
Если сезон уже завершён или команда не играет — скажи об этом.

Ответь строго в JSON без markdown:
{
  "found": true/false,
  "team1": "команда хозяев",
  "team2": "команда гостей",
  "date": "YYYY-MM-DD",
  "time": "HH:MM МСК",
  "venue": "арена",
  "message": "если не найден — почему",
  "suggestions": ["вариант 1", "вариант 2"]
}`;

  try {
    const raw = await queryPerplexity(prompt);
    return parseRawResponse(raw);
  } catch {
    return null;
  }
}

function parseRawResponse(raw: string): RawMatchCandidate {
  const jsonStr = extractJson(raw);
  return JSON.parse(jsonStr) as RawMatchCandidate;
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  throw new Error("Не удалось извлечь JSON из ответа Perplexity");
}

/** Get current time in Moscow timezone as "HH:MM" */
function getMskTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Check if match hasn't started yet. For today's matches — compare time. */
function isMatchInFuture(
  matchDate: string,
  matchTime: string | undefined,
  today: string,
  nowMsk: string
): boolean {
  if (matchDate > today) return true;
  if (matchDate < today) return false;

  // Match is today — check time
  if (!matchTime) return false; // No time info for today's match — skip it to be safe

  // Extract HH:MM from time string (e.g. "19:30 МСК" → "19:30")
  const timeMatch = matchTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return false;

  const matchHHMM = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  return matchHHMM > nowMsk;
}
