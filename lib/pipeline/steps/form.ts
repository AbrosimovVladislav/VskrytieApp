import { MatchInfo, LeagueConfig, FormData } from "@/types/pipeline";

interface FormInput {
  match: MatchInfo;
  leagueConfig: LeagueConfig;
}

export async function fetchForm(input: FormInput): Promise<FormData> {
  // TODO: Phase 3.2 — real Perplexity request
  await delay(700);

  return {
    team1_last5: [
      { date: "2026-03-20", opponent: "Динамо Москва", score: "3:2", home: true, result: "W" },
      { date: "2026-03-18", opponent: "Локомотив", score: "1:2", home: false, result: "L" },
      { date: "2026-03-15", opponent: "Спартак", score: "4:1", home: true, result: "W" },
      { date: "2026-03-13", opponent: "Торпедо", score: "2:3", home: false, result: "OTL" },
      { date: "2026-03-10", opponent: "Витязь", score: "5:0", home: true, result: "W" },
    ],
    team2_last5: [
      { date: "2026-03-20", opponent: "Металлург", score: "2:1", home: true, result: "W" },
      { date: "2026-03-17", opponent: "Авангард", score: "3:3", home: false, result: "OTW" },
      { date: "2026-03-14", opponent: "Ак Барс", score: "1:4", home: true, result: "L" },
      { date: "2026-03-12", opponent: "Трактор", score: "3:2", home: false, result: "W" },
      { date: "2026-03-09", opponent: "Салават Юлаев", score: "2:0", home: true, result: "W" },
    ],
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
