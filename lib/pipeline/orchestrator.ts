import {
  PipelineInput,
  PipelineResult,
  PipelineStepProgress,
} from "@/types/pipeline";
import { getLeagueConfig } from "@/lib/config/leagues";
import { fetchContextMotivation } from "./steps/context-motivation";
import { fetchForm } from "./steps/form";
import { fetchH2H } from "./steps/h2h";
import { fetchStats } from "./steps/stats";
import { fetchSquadContext } from "./steps/squad-context";
import { fetchOdds } from "./steps/odds";
import { runAnalysis } from "./steps/analysis";

const STEP_NAMES = [
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
  const match = input.match;

  function reportStep(step: number, status: PipelineStepProgress["status"]) {
    onProgress?.({ step, name: STEP_NAMES[step - 1], status });
  }

  // Steps 1-6: parallel data collection (steps 2-7 from old numbering)
  reportStep(1, "in_progress");
  reportStep(2, "in_progress");
  reportStep(3, "in_progress");
  reportStep(4, "in_progress");
  reportStep(5, "in_progress");
  reportStep(6, "in_progress");

  const [motivation, form, h2h, stats, squadContext, odds] = await Promise.all([
    fetchContextMotivation({ match, leagueConfig }).then((r) => {
      reportStep(1, "done");
      return r;
    }),
    fetchForm({ match, leagueConfig }).then((r) => {
      reportStep(2, "done");
      return r;
    }),
    fetchH2H({ match, leagueConfig }).then((r) => {
      reportStep(3, "done");
      return r;
    }),
    fetchStats({ match, leagueConfig }).then((r) => {
      reportStep(4, "done");
      return r;
    }),
    fetchSquadContext({ match, leagueConfig }).then((r) => {
      reportStep(5, "done");
      return r;
    }),
    fetchOdds({ match, leagueConfig }).then((r) => {
      reportStep(6, "done");
      return r;
    }),
  ]);

  // Step 7: Analysis
  reportStep(7, "in_progress");
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
  reportStep(7, "done");

  return { match, motivation, form, h2h, stats, squadContext, odds, report };
}
