"use client";

import { ReactNode } from "react";
import { SectionWrapper } from "./section-wrapper";

const STAT_LABELS: Record<string, string> = {
  position: "Позиция",
  points: "Очки",
  goalsFor: "Голы забитые",
  goalsAgainst: "Голы пропущ.",
  avgGoalsFor: "Ср. голов/матч",
  avgGoalsAgainst: "Ср. пропущ.",
  powerPlayPct: "Большинство %",
  penaltyKillPct: "Меньшинство %",
  penaltyMinutes: "Штраф мин/матч",
  shotsPerGame: "Броски/матч",
  // Filtered categories from analysis.ts
  "Атака": "Атака",
  "Оборона": "Оборона",
  "Большинство": "Большинство",
  "Меньшинство": "Меньшинство",
};

interface StatsSectionProps {
  team1Name: string;
  team2Name: string;
  team1Stats: Record<string, string | number>;
  team2Stats: Record<string, string | number>;
  analysis: string;
  debugSlot?: ReactNode;
}

export function StatsSection({
  team1Name,
  team2Name,
  team1Stats,
  team2Stats,
  analysis,
  debugSlot,
}: StatsSectionProps) {
  const keys = Object.keys(team1Stats);

  return (
    <SectionWrapper title="Статистика" analysis={analysis} debugSlot={debugSlot}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-text-secondary">{team1Name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-text-secondary" />
          <span className="text-text-secondary">{team2Name}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {keys.map((key) => {
          const v1 = parseFloat(String(team1Stats[key]));
          const v2 = parseFloat(String(team2Stats[key]));
          const label = STAT_LABELS[key] || key;

          return (
            <StatBar
              key={key}
              label={label}
              val1={team1Stats[key]}
              val2={team2Stats[key]}
              num1={isNaN(v1) ? 0 : v1}
              num2={isNaN(v2) ? 0 : v2}
            />
          );
        })}
      </div>
    </SectionWrapper>
  );
}

function StatBar({
  label,
  val1,
  val2,
  num1,
  num2,
}: {
  label: string;
  val1: string | number;
  val2: string | number;
  num1: number;
  num2: number;
}) {
  const max = Math.max(num1, num2, 1);
  const pct1 = (num1 / max) * 100;
  const pct2 = (num2 / max) * 100;

  return (
    <div>
      {/* Values on sides, label in center */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-text font-medium text-[13px] tabular-nums w-12">{val1}</span>
        <span className="text-text-secondary text-[12px] text-center flex-1">{label}</span>
        <span className="text-text-secondary text-[13px] tabular-nums w-12 text-right">{val2}</span>
      </div>
      {/* Bars: team1 goes right-to-left, team2 goes left-to-right */}
      <div className="flex gap-1">
        <div className="flex-1 h-[6px] bg-bg-card-dark rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
        </div>
        <div className="flex-1 h-[6px] bg-bg-card-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-text-secondary rounded-full transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
        </div>
      </div>
    </div>
  );
}
