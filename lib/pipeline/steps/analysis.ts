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
  await delay(1000);

  return {
    match: {
      team1: input.match.team1,
      team2: input.match.team2,
      date: input.match.date,
      time: input.match.time,
      venue: input.match.venue,
      league: input.match.league,
    },
    motivation: {
      data: {
        team1: "ЦСКА на 3-м месте, борется за домашнюю площадку в плей-офф. Каждое очко критично.",
        team2: "СКА лидирует с запасом, но хочет сохранить первую строчку.",
      },
      analysis:
        "ЦСКА более мотивирован — им нужна победа для укрепления позиций. СКА может позволить себе тактические эксперименты.",
    },
    form: {
      data: {
        team1_last5: input.form.team1_last5,
        team2_last5: input.form.team2_last5,
      },
      analysis:
        "ЦСКА в хорошей форме (3W, 1L, 1OTL), особенно сильны дома. СКА стабильны (3W, 1OTW, 1L), но проиграли Ак Барсу дома.",
    },
    h2h: {
      data: { games: input.h2h.games },
      analysis:
        "В трёх встречах сезона счёт 2:1 в пользу ЦСКА. Оба домашних матча ЦСКА выиграли.",
    },
    stats: {
      data: { team1: input.stats.team1, team2: input.stats.team2 },
      analysis:
        "СКА лидирует по ключевым показателям, но ЦСКА сильнее в реализации большинства (24.1% vs 26.3%).",
    },
    context: {
      data: {
        team1: "Травма Окулова ослабляет атаку, но основной состав в строю.",
        team2: "Все лидеры здоровы, связка Шипачёв—Ткачёв в ударе.",
      },
      analysis:
        "Кадровое преимущество на стороне СКА. Потеря Окулова для ЦСКА ощутима, но не критична.",
    },
    odds: {
      data: { bookmakers: input.odds.bookmakers },
      analysis:
        "Букмекеры дают ЦСКА лёгкое преимущество как хозяевам (≈2.10). Тотал 4.5 — баланс в пользу меньше.",
    },
    recommendation: {
      summary:
        "ЦСКА дома с высокой мотивацией и преимуществом в личных встречах. СКА сильнее по статистике, но без давления. Ожидаем плотный матч с небольшим перевесом хозяев.",
      bets: [
        {
          market: "Исход в основное время",
          pick: "П1",
          confidence: "medium",
          reasoning:
            "ЦСКА дома сильны, мотивация выше, преимущество в H2H. Но СКА объективно сильнее по составу.",
        },
        {
          market: "Тотал",
          pick: "Меньше 4.5",
          confidence: "medium",
          reasoning:
            "Оба клуба хороши в обороне (2.2 и 2.0 пропущенных в среднем). В плей-офф стиле матчи обычно закрытые.",
        },
      ],
    },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
