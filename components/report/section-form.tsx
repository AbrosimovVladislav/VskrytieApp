"use client";

import { ReactNode } from "react";
import { GameResult } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface FormSectionProps {
  team1Name: string;
  team2Name: string;
  team1Games: GameResult[];
  team2Games: GameResult[];
  analysis: string;
  debugSlot?: ReactNode;
}

export function FormSection({
  team1Name,
  team2Name,
  team1Games,
  team2Games,
  analysis,
  debugSlot,
}: FormSectionProps) {
  return (
    <SectionWrapper
      title="Форма (последние 5 матчей)"
      analysis={analysis}
      debugSlot={debugSlot}
    >
      <div className="flex flex-col gap-3">
        <TeamForm teamName={team1Name} games={team1Games} />
        <TeamForm teamName={team2Name} games={team2Games} />
      </div>
    </SectionWrapper>
  );
}

const RESULT_CONFIG: Record<GameResult["result"], { bg: string; text: string; label: string }> = {
  W: { bg: "bg-positive", text: "text-bg", label: "В" },
  L: { bg: "bg-negative", text: "text-white", label: "П" },
  OTW: { bg: "bg-positive/60", text: "text-bg", label: "ОТВ" },
  OTL: { bg: "bg-negative/60", text: "text-white", label: "ОТП" },
};

function TeamForm({
  teamName,
  games,
}: {
  teamName: string;
  games: GameResult[];
}) {
  const wins = games.filter(
    (g) => g.result === "W" || g.result === "OTW"
  ).length;
  const total = games.length;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-text font-medium text-[13px]">{teamName}</span>
        <span className="font-display text-[12px] text-accent">{winPct}%</span>
      </div>

      {/* Result strip — colored segments */}
      <div className="flex gap-1 mb-2">
        {games.map((g, i) => {
          const cfg = RESULT_CONFIG[g.result];
          return (
            <div
              key={i}
              className={`flex-1 h-8 ${cfg.bg} rounded-md flex items-center justify-center`}
            >
              <span className={`text-[11px] font-semibold ${cfg.text}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Opponent + score row */}
      <div className="flex gap-1">
        {games.map((g, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[9px] text-text-secondary truncate">{g.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
