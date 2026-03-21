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

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisReport> {
  // TODO: Phase 4 — real Claude API request
  await delay(500);

  const { match, motivation, form, h2h, stats, squadContext, odds } = input;

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
      analysis: "Анализ мотивации будет доступен после подключения Claude (фаза 4)",
    },
    form: {
      data: {
        team1_last5: form.team1_last5,
        team2_last5: form.team2_last5,
      },
      analysis: "Анализ формы будет доступен после подключения Claude (фаза 4)",
    },
    h2h: {
      data: { games: h2h.games },
      analysis: "Анализ H2H будет доступен после подключения Claude (фаза 4)",
    },
    stats: {
      data: { team1: stats.team1, team2: stats.team2 },
      analysis: "Анализ статистики будет доступен после подключения Claude (фаза 4)",
    },
    context: {
      data: {
        team1: `${squadContext.team1.injuries}. ${squadContext.team1.media_summary}`,
        team2: `${squadContext.team2.injuries}. ${squadContext.team2.media_summary}`,
      },
      analysis: "Анализ контекста будет доступен после подключения Claude (фаза 4)",
    },
    odds: {
      data: { bookmakers: odds.bookmakers },
      analysis: "Анализ коэффициентов будет доступен после подключения Claude (фаза 4)",
    },
    recommendation: {
      summary: "Рекомендация будет доступна после подключения Claude (фаза 4)",
      bets: [],
    },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
