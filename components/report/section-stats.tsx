"use client";

import { SectionWrapper } from "./section-wrapper";

const STAT_LABELS: Record<string, string> = {
  position: "Позиция",
  points: "Очки",
  goalsFor: "Голы забитые",
  goalsAgainst: "Голы пропущенные",
  avgGoalsFor: "Ср. голов за матч",
  avgGoalsAgainst: "Ср. пропущенных",
  powerPlayPct: "Большинство (%)",
  penaltyKillPct: "Меньшинство (%)",
  penaltyMinutes: "Штрафные мин/матч",
  shotsPerGame: "Броски за матч",
};

interface StatsSectionProps {
  team1Name: string;
  team2Name: string;
  team1Stats: Record<string, string | number>;
  team2Stats: Record<string, string | number>;
  analysis: string;
}

export function StatsSection({
  team1Name,
  team2Name,
  team1Stats,
  team2Stats,
  analysis,
}: StatsSectionProps) {
  const keys = Object.keys(team1Stats);

  return (
    <SectionWrapper title="Статистика" analysis={analysis}>
      <div className="flex flex-col gap-3">
        {keys.map((key) => {
          const v1 = parseFloat(String(team1Stats[key]));
          const v2 = parseFloat(String(team2Stats[key]));
          const label = STAT_LABELS[key] || key;

          return (
            <StatBar
              key={key}
              label={label}
              team1Name={team1Name}
              team2Name={team2Name}
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
  team1Name,
  team2Name,
  val1,
  val2,
  num1,
  num2,
}: {
  label: string;
  team1Name: string;
  team2Name: string;
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
      <p className="text-text-secondary text-[12px] mb-1">{label}</p>
      {/* Team 1 */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-text text-[12px] w-[60px] truncate">
          {team1Name}
        </span>
        <div className="flex-1 h-[6px] bg-bg-card-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
        </div>
        <span className="text-text text-[12px] tabular-nums w-[48px] text-right">
          {val1}
        </span>
      </div>
      {/* Team 2 */}
      <div className="flex items-center gap-2">
        <span className="text-text-secondary text-[12px] w-[60px] truncate">
          {team2Name}
        </span>
        <div className="flex-1 h-[6px] bg-bg-card-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-text-secondary rounded-full transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
        </div>
        <span className="text-text-secondary text-[12px] tabular-nums w-[48px] text-right">
          {val2}
        </span>
      </div>
    </div>
  );
}
