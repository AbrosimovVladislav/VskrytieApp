import Anthropic from "@anthropic-ai/sdk";
import {
  MatchInfo,
  LeagueConfig,
  MotivationData,
  FormData,
  H2HData,
  StatsData,
  SquadContextData,
  OddsData,
  AnalysisReport,
  GameResult,
} from "@/types/pipeline";

interface AnalysisInput {
  match: MatchInfo;
  motivation: MotivationData;
  form: FormData;
  h2h: H2HData;
  stats: StatsData;
  squadContext: SquadContextData;
  odds: OddsData;
  leagueConfig: LeagueConfig;
}

const SPORT_ANALYST: Record<string, string> = {
  hockey: "хоккейный",
  football: "футбольный",
  basketball: "баскетбольный",
};

const BET_MARKET_NAMES: Record<string, string> = {
  outcome_regular: "Исход в основное время",
  total: "Тотал",
  outcome: "Исход (с учётом ОТ/буллитов)",
  handicap: "Фора",
};

// Маппинг русских лейблов из stats.ts → 4 категории для UI
const STATS_CATEGORY: Record<string, string> = {
  "Голы забитые": "Атака",
  "Ср. голов забито": "Атака",
  "Голы пропущенные": "Оборона",
  "Ср. голов пропущено": "Оборона",
  "Большинство %": "Большинство",
  "Меньшинство %": "Меньшинство",
};

// Приоритет: средние значения лучше абсолютных
const STATS_PRIORITY: Record<string, number> = {
  "Ср. голов забито": 2,
  "Голы забитые": 1,
  "Ср. голов пропущено": 2,
  "Голы пропущенные": 1,
  "Большинство %": 1,
  "Меньшинство %": 1,
};

function filterStats(
  data: Record<string, string | number>
): Record<string, string | number> {
  // Группируем по категории, берём лучший показатель (с бо́льшим приоритетом)
  const byCategory: Record<string, { value: string | number; priority: number }> = {};
  for (const [key, value] of Object.entries(data)) {
    const category = STATS_CATEGORY[key];
    if (!category) continue;
    const priority = STATS_PRIORITY[key] || 0;
    if (!byCategory[category] || priority > byCategory[category].priority) {
      byCategory[category] = { value, priority };
    }
  }
  const result: Record<string, string | number> = {};
  for (const cat of ["Атака", "Оборона", "Большинство", "Меньшинство"]) {
    if (byCategory[cat]) result[cat] = byCategory[cat].value;
  }
  return result;
}

function buildSystemPrompt(config: LeagueConfig): string {
  const analyst = SPORT_ANALYST[config.sport] || config.sport;
  const markets = config.betMarkets
    .map((m) => BET_MARKET_NAMES[m] || m)
    .join(", ");

  return `Ты — профессиональный ${analyst} аналитик. Проанализируй данные о предстоящем матче и верни структурированный JSON-ответ.

КРИТИЧЕСКИ ВАЖНО:
- Опирайся ТОЛЬКО на предоставленные данные. НЕ выдумывай факты, травмы, мотивации, которых нет в данных.
- Внимательно читай поле "Стадия сезона" — если это плейофф, кубок, решающие матчи, учитывай это во ВСЕХ секциях. В плейофф мотивация максимальная у ОБЕИХ команд, не пиши что кто-то "демотивирован" без явных данных.
- Если написано "борьба за плейофф", "1/4 финала", "финал конференции" и т.п. — это радикально меняет контекст матча.

Стиль:
- Коротко, ёмко, как инсайдер. Без воды.
- Каждый analysis — 1-2 предложения.
- context: по 1-2 предложения на команду, только важное (травмы, ключевые отсутствия, настрой).
- recommendation.summary — 1-2 предложения, чёткий вывод.
- reasoning — 1 короткое предложение.

Рынки ставок: ${markets}. Ровно 2 ставки.

Ответ — ТОЛЬКО валидный JSON, без markdown, без \`\`\`json:
{
  "motivation": { "analysis": "string" },
  "form": { "analysis": "string" },
  "h2h": { "analysis": "string" },
  "stats": { "analysis": "string" },
  "context": { "team1_analysis": "string", "team2_analysis": "string" },
  "odds": { "analysis": "string" },
  "recommendation": {
    "summary": "string",
    "bets": [{ "market": "string", "pick": "string", "confidence": "high|medium|low", "reasoning": "string" }]
  }
}`;
}

function formatGameResult(g: GameResult, teamName: string): string {
  const loc = g.home ? "дома" : "в гостях";
  return `${g.date} — ${teamName} vs ${g.opponent} (${loc}): ${g.score} [${g.result}]`;
}

function buildUserPrompt(input: AnalysisInput): string {
  const { match, motivation, form, h2h, stats, squadContext, odds } = input;

  const formTeam1 = form.team1_last5
    .map((g) => formatGameResult(g, match.team1))
    .join("\n");
  const formTeam2 = form.team2_last5
    .map((g) => formatGameResult(g, match.team2))
    .join("\n");

  const h2hGames = h2h.games
    .map((g) => `${g.date} — ${g.score} (${g.venue})`)
    .join("\n");

  const statsTeam1 = Object.entries(stats.team1)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const statsTeam2 = Object.entries(stats.team2)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const oddsLines = odds.bookmakers
    .map(
      (b) =>
        `${b.name}: П1=${b.outcome_home} Н=${b.outcome_draw} П2=${b.outcome_away} ТБ=${b.total_over} ТМ=${b.total_under}`
    )
    .join("\n");

  return `## Матч
${match.team1} vs ${match.team2}, ${match.league}, ${match.date}, ${match.time}, ${match.venue}

## Контекст и мотивация
${match.team1}: ${motivation.team1.position}, ${motivation.team1.fighting_for}, приоритет: ${motivation.team1.priority}
${match.team2}: ${motivation.team2.position}, ${motivation.team2.fighting_for}, приоритет: ${motivation.team2.priority}
Стадия сезона: ${motivation.stage}

## Форма (последние 5 матчей)
${match.team1}:
${formTeam1 || "Нет данных"}

${match.team2}:
${formTeam2 || "Нет данных"}

## H2H в сезоне
${h2hGames || "Нет данных"}

## Статистика сезона
${match.team1}: ${statsTeam1 || "Нет данных"}
${match.team2}: ${statsTeam2 || "Нет данных"}

## Кадры и контекст
${match.team1}: ${squadContext.team1.injuries}. ${squadContext.team1.media_summary}. Ротация: ${squadContext.team1.rotation_expected}
${match.team2}: ${squadContext.team2.injuries}. ${squadContext.team2.media_summary}. Ротация: ${squadContext.team2.rotation_expected}

## Букмекерские линии
${oddsLines || "Нет данных"}`;
}

interface ClaudeAnalysis {
  motivation: { analysis: string };
  form: { analysis: string };
  h2h: { analysis: string };
  stats: { analysis: string };
  context: { team1_analysis: string; team2_analysis: string };
  odds: { analysis: string };
  recommendation: {
    summary: string;
    bets: { market: string; pick: string; confidence: "high" | "medium" | "low"; reasoning: string }[];
  };
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisReport> {
  const { match, motivation, form, h2h, stats, squadContext, odds, leagueConfig } = input;

  const anthropic = new Anthropic();

  const systemPrompt = buildSystemPrompt(leagueConfig);
  const userPrompt = buildUserPrompt(input);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let analysis: ClaudeAnalysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error(`Claude вернул невалидный JSON: ${text.slice(0, 200)}`);
    }
  }

  return {
    match: {
      team1: match.team1,
      team2: match.team2,
      date: match.date,
      time: match.time,
      venue: match.venue,
      league: match.league,
    },
    motivation: {
      data: {
        team1: `${motivation.team1.position}, ${motivation.team1.fighting_for.toLowerCase()}`,
        team2: `${motivation.team2.position}, ${motivation.team2.fighting_for.toLowerCase()}`,
      },
      analysis: analysis.motivation.analysis,
    },
    form: {
      data: {
        team1_last5: form.team1_last5,
        team2_last5: form.team2_last5,
      },
      analysis: analysis.form.analysis,
    },
    h2h: {
      data: { games: h2h.games },
      analysis: analysis.h2h.analysis,
    },
    stats: {
      data: { team1: filterStats(stats.team1), team2: filterStats(stats.team2) },
      analysis: analysis.stats.analysis,
    },
    context: {
      team1_analysis: analysis.context.team1_analysis,
      team2_analysis: analysis.context.team2_analysis,
    },
    odds: {
      data: { bookmakers: odds.bookmakers },
      analysis: analysis.odds.analysis,
    },
    recommendation: {
      summary: analysis.recommendation.summary,
      bets: analysis.recommendation.bets,
    },
  };
}
