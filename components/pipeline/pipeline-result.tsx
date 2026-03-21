"use client";

import { AnalysisReport, DebugLog } from "@/types/pipeline";
import { MatchHeader } from "@/components/report/match-header";
import { MotivationSection } from "@/components/report/section-motivation";
import { FormSection } from "@/components/report/section-form";
import { H2HSection } from "@/components/report/section-h2h";
import { StatsSection } from "@/components/report/section-stats";
import { ContextSection } from "@/components/report/section-context";
import { OddsSection } from "@/components/report/section-odds";
import {
  RecommendationSection,
  Disclaimer,
} from "@/components/report/section-recommendation";
import { DebugRaw } from "@/components/debug/debug-raw";
import { ReactNode } from "react";

interface PipelineResultProps {
  report: AnalysisReport;
}

function debugFor(logs: DebugLog[] | undefined, prefix: string): ReactNode {
  if (!logs) return null;
  const matched = logs.filter((l) =>
    l.step.toLowerCase().includes(prefix.toLowerCase())
  );
  if (matched.length === 0) return null;
  return (
    <>
      {matched.map((l, i) => (
        <DebugRaw key={i} label={l.step} data={l.raw} />
      ))}
    </>
  );
}

export function PipelineResult({ report }: PipelineResultProps) {
  const d = report._debugLogs;

  return (
    <div className="flex flex-col gap-3 px-2 py-3">
      <MatchHeader
        team1={report.match.team1}
        team2={report.match.team2}
        date={report.match.date}
        time={report.match.time}
        venue={report.match.venue}
        league={report.match.league}
      />

      <MotivationSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1={report.motivation.data.team1}
        team2={report.motivation.data.team2}
        stage={report.motivation.data.stage}
        analysis={report.motivation.analysis}
        debugSlot={debugFor(d, "мотив")}
      />

      <FormSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Games={report.form.data.team1_last5}
        team2Games={report.form.data.team2_last5}
        analysis={report.form.analysis}
        debugSlot={debugFor(d, "форм")}
      />

      <H2HSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        games={report.h2h.data.games}
        analysis={report.h2h.analysis}
        debugSlot={debugFor(d, "h2h") || debugFor(d, "истор")}
      />

      <StatsSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Stats={report.stats.data.team1}
        team2Stats={report.stats.data.team2}
        analysis={report.stats.analysis}
        debugSlot={debugFor(d, "стат")}
      />

      <ContextSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Squad={report.context.team1}
        team2Squad={report.context.team2}
        team1Analysis={report.context.team1_analysis}
        team2Analysis={report.context.team2_analysis}
        debugSlot={debugFor(d, "контекст") || debugFor(d, "кадр")}
      />

      <OddsSection
        bookmakers={report.odds.data.bookmakers}
        analysis={report.odds.analysis}
        debugSlot={debugFor(d, "коэфф") || debugFor(d, "odds")}
      />

      <RecommendationSection
        summary={report.recommendation.summary}
        bets={report.recommendation.bets}
      />

      <Disclaimer />
    </div>
  );
}
