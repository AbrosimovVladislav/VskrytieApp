"use client";

import { useState } from "react";
import { AnalysisReport, DebugLog } from "@/types/pipeline";

interface PipelineResultProps {
  report: AnalysisReport;
  debugLogs?: DebugLog[];
}

export function PipelineResult({ report, debugLogs }: PipelineResultProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Debug Panel */}
      {debugLogs && debugLogs.length > 0 && (
        <DebugPanel logs={debugLogs} />
      )}

      {/* Match Header */}
      <div className="bg-bg-card rounded-[--radius-card] border border-border p-4">
        <h2 className="font-display text-sm text-accent mb-2">
          {report.match.team1} vs {report.match.team2}
        </h2>
        <p className="text-text-secondary text-xs">
          {report.match.league} · {report.match.date} · {report.match.time} · {report.match.venue}
        </p>
      </div>

      {/* Sections */}
      <Section title="Мотивация" analysis={report.motivation.analysis}>
        <p className="text-text-secondary text-sm mb-1">
          <span className="text-text">{report.match.team1}:</span>{" "}
          {report.motivation.data.team1}
        </p>
        <p className="text-text-secondary text-sm">
          <span className="text-text">{report.match.team2}:</span>{" "}
          {report.motivation.data.team2}
        </p>
      </Section>

      <Section title="Форма" analysis={report.form.analysis}>
        <TeamForm
          teamName={report.match.team1}
          games={report.form.data.team1_last5}
        />
        <TeamForm
          teamName={report.match.team2}
          games={report.form.data.team2_last5}
        />
      </Section>

      <Section title="История встреч" analysis={report.h2h.analysis}>
        {report.h2h.data.games.map((g, i) => (
          <p key={i} className="text-text-secondary text-sm">
            {g.date} — {g.score} ({g.venue})
          </p>
        ))}
      </Section>

      <Section title="Статистика" analysis={report.stats.analysis}>
        <div className="grid grid-cols-3 gap-1 text-xs">
          <span className="text-text-secondary">Метрика</span>
          <span className="text-text text-center">{report.match.team1}</span>
          <span className="text-text text-center">{report.match.team2}</span>
          {Object.keys(report.stats.data.team1).map((key) => (
            <StatRow
              key={key}
              label={key}
              val1={report.stats.data.team1[key]}
              val2={report.stats.data.team2[key]}
            />
          ))}
        </div>
      </Section>

      <Section title="Контекст" analysis={report.context.analysis}>
        <p className="text-text-secondary text-sm mb-1">
          <span className="text-text">{report.match.team1}:</span>{" "}
          {report.context.data.team1}
        </p>
        <p className="text-text-secondary text-sm">
          <span className="text-text">{report.match.team2}:</span>{" "}
          {report.context.data.team2}
        </p>
      </Section>

      <Section title="Коэффициенты" analysis={report.odds.analysis}>
        <div className="grid grid-cols-6 gap-1 text-xs">
          <span className="text-text-secondary">БК</span>
          <span className="text-text-secondary text-center">П1</span>
          <span className="text-text-secondary text-center">X</span>
          <span className="text-text-secondary text-center">П2</span>
          <span className="text-text-secondary text-center">ТБ</span>
          <span className="text-text-secondary text-center">ТМ</span>
          {report.odds.data.bookmakers.map((b) => (
            <OddsRow key={b.name} bk={b} />
          ))}
        </div>
      </Section>

      {/* Recommendation */}
      <div className="bg-bg-card-dark rounded-[--radius-card] border border-border-accent p-4">
        <h3 className="font-semibold text-accent text-sm mb-2">Рекомендация</h3>
        <p className="text-text-secondary text-sm mb-3">{report.recommendation.summary}</p>
        {report.recommendation.bets.map((bet, i) => (
          <div key={i} className="mb-2 last:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text text-sm font-medium">{bet.pick}</span>
              <span className="text-xs text-text-secondary">({bet.market})</span>
              <ConfidenceBadge level={bet.confidence} />
            </div>
            <p className="text-text-secondary text-xs">{bet.reasoning}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-muted text-xs text-center px-4 pb-4">
        Данный анализ носит информационный характер и не является финансовой
        рекомендацией. Делайте ставки ответственно.
      </p>
    </div>
  );
}

function Section({
  title,
  analysis,
  children,
}: {
  title: string;
  analysis: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-4">
      <h3 className="font-semibold text-sm text-text mb-3">{title}</h3>
      <div className="mb-3">{children}</div>
      <div className="border-t border-border pt-2">
        <p className="text-accent text-xs italic">{analysis}</p>
      </div>
    </div>
  );
}

function TeamForm({
  teamName,
  games,
}: {
  teamName: string;
  games: { result: string; opponent: string; score: string }[];
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-text text-sm mb-1">{teamName}</p>
      <div className="flex gap-1 mb-1">
        {games.map((g, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-medium ${
              g.result === "W"
                ? "bg-positive/20 text-positive"
                : g.result === "L"
                  ? "bg-negative/20 text-negative"
                  : "bg-warning/20 text-warning"
            }`}
          >
            {g.result[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatRow({
  label,
  val1,
  val2,
}: {
  label: string;
  val1: string | number;
  val2: string | number;
}) {
  return (
    <>
      <span className="text-text-secondary">{label}</span>
      <span className="text-text text-center tabular-nums">{val1}</span>
      <span className="text-text text-center tabular-nums">{val2}</span>
    </>
  );
}

function OddsRow({
  bk,
}: {
  bk: {
    name: string;
    outcome_home: number;
    outcome_draw: number;
    outcome_away: number;
    total_over: number;
    total_under: number;
  };
}) {
  return (
    <>
      <span className="text-text-secondary truncate">{bk.name}</span>
      <span className="text-text text-center tabular-nums">{bk.outcome_home}</span>
      <span className="text-text text-center tabular-nums">{bk.outcome_draw}</span>
      <span className="text-text text-center tabular-nums">{bk.outcome_away}</span>
      <span className="text-text text-center tabular-nums">{bk.total_over}</span>
      <span className="text-text text-center tabular-nums">{bk.total_under}</span>
    </>
  );
}

function DebugPanel({ logs }: { logs: DebugLog[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-[--radius-card] p-4">
      <h3 className="font-semibold text-sm text-yellow-400 mb-3">
        DEBUG: Perplexity Raw Responses
      </h3>
      {logs.map((log, i) => (
        <div key={i} className="mb-2 last:mb-0">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="text-yellow-300 text-xs font-medium hover:text-yellow-200 w-full text-left"
          >
            {openIndex === i ? "▼" : "▶"} {log.step}
          </button>
          {openIndex === i && (
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-yellow-500 text-[10px] uppercase mb-1">Prompt:</p>
                <pre className="bg-black/40 rounded p-2 text-[11px] text-yellow-200/80 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                  {log.prompt}
                </pre>
              </div>
              <div>
                <p className="text-yellow-500 text-[10px] uppercase mb-1">Raw Response:</p>
                <pre className="bg-black/40 rounded p-2 text-[11px] text-green-300/80 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                  {log.raw}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-positive/20 text-positive",
    medium: "bg-warning/20 text-warning",
    low: "bg-negative/20 text-negative",
  };
  const labels = { high: "Высокая", medium: "Средняя", low: "Низкая" };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-[--radius-tag] ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}
