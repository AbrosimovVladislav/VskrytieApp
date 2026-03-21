"use client";

import { AnalysisReport } from "@/types/pipeline";
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

interface PipelineResultProps {
  report: AnalysisReport;
}

export function PipelineResult({ report }: PipelineResultProps) {
  const debugLogs = report._debugLogs;

  return (
    <div className="flex flex-col gap-4 p-4">
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
        team1Data={report.motivation.data.team1}
        team2Data={report.motivation.data.team2}
        analysis={report.motivation.analysis}
      />

      <FormSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Games={report.form.data.team1_last5}
        team2Games={report.form.data.team2_last5}
        analysis={report.form.analysis}
      />

      <H2HSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        games={report.h2h.data.games}
        analysis={report.h2h.analysis}
      />

      <StatsSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Stats={report.stats.data.team1}
        team2Stats={report.stats.data.team2}
        analysis={report.stats.analysis}
      />

      <ContextSection
        team1Name={report.match.team1}
        team2Name={report.match.team2}
        team1Analysis={report.context.team1_analysis}
        team2Analysis={report.context.team2_analysis}
      />

      <OddsSection
        bookmakers={report.odds.data.bookmakers}
        analysis={report.odds.analysis}
      />

      <RecommendationSection
        summary={report.recommendation.summary}
        bets={report.recommendation.bets}
      />

      <Disclaimer />

      {/* Debug logs (dev only) */}
      {debugLogs && debugLogs.length > 0 && (
        <div className="flex flex-col gap-2">
          {debugLogs.map((l, i) => (
            <DebugRaw key={i} label={l.step} data={l.raw} />
          ))}
        </div>
      )}
    </div>
  );
}
