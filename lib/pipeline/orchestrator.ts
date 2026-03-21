import {
  PipelineInput,
  PipelineResult,
  PipelineStepProgress,
} from "@/types/pipeline";
import { getLeagueConfig } from "@/lib/config/leagues";
import { findMatch } from "./steps/find-match";
import { fetchContextMotivation } from "./steps/context-motivation";
import { fetchForm } from "./steps/form";
import { fetchH2H } from "./steps/h2h";
import { fetchStats } from "./steps/stats";
import { fetchSquadContext } from "./steps/squad-context";
import { fetchOdds } from "./steps/odds";
import { runAnalysis } from "./steps/analysis";

const STEP_NAMES = [
  "Поиск матча",
  "Контекст и мотивация",
  "Форма команд",
  "История встреч",
  "Статистика",
  "Кадры и новости",
  "Коэффициенты",
  "Анализ AI",
];

type OnProgress = (progress: PipelineStepProgress) => void;

export async function runPipeline(
  input: PipelineInput,
  onProgress?: OnProgress
): Promise<PipelineResult> {
  const leagueConfig = getLeagueConfig(input.league);

  function reportStep(step: number, status: PipelineStepProgress["status"]) {
    onProgress?.({ step, name: STEP_NAMES[step - 1], status });
  }

  // Step 1: Find match
  reportStep(1, "in_progress");
  const match = await findMatch({
    query: input.query,
    sport: input.sport,
    leagueConfig,
  });
  reportStep(1, "done");

  // Steps 2-7: parallel data collection
  reportStep(2, "in_progress");
  reportStep(3, "in_progress");
  reportStep(4, "in_progress");
  reportStep(5, "in_progress");
  reportStep(6, "in_progress");
  reportStep(7, "in_progress");

  const [motivation, form, h2h, stats, squadContext, odds] = await Promise.all([
    fetchContextMotivation({ match, leagueConfig }).then((r) => {
      reportStep(2, "done");
      return r;
    }),
    fetchForm({ match, leagueConfig }).then((r) => {
      reportStep(3, "done");
      return r;
    }),
    fetchH2H({ match, leagueConfig }).then((r) => {
      reportStep(4, "done");
      return r;
    }),
    fetchStats({ match, leagueConfig }).then((r) => {
      reportStep(5, "done");
      return r;
    }),
    fetchSquadContext({ match, leagueConfig }).then((r) => {
      reportStep(6, "done");
      return r;
    }),
    fetchOdds({ match, leagueConfig }).then((r) => {
      reportStep(7, "done");
      return r;
    }),
  ]);

  // Step 8: Analysis
  reportStep(8, "in_progress");
  const report = await runAnalysis({
    match,
    motivation,
    form,
    h2h,
    stats,
    squadContext,
    odds,
    leagueConfig,
  });
  reportStep(8, "done");

  return { match, motivation, form, h2h, stats, squadContext, odds, report };
}
