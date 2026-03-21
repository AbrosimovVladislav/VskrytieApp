"use client";

import { ReactNode } from "react";
import { H2HGame } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface H2HSectionProps {
  team1Name: string;
  team2Name: string;
  games: H2HGame[];
  analysis: string;
  debugSlot?: ReactNode;
}

export function H2HSection({
  team1Name,
  team2Name,
  games,
  analysis,
  debugSlot,
}: H2HSectionProps) {
  return (
    <SectionWrapper
      title={`Встречи в сезоне (${games.length})`}
      analysis={analysis}
      debugSlot={debugSlot}
    >
      <div className="flex flex-col gap-1.5">
        {games.map((g, i) => {
          const parts = g.score.split(/[:\-–]/);
          const n1 = parseInt(parts[0]?.trim() ?? "");
          const n2 = parseInt(parts[1]?.trim() ?? "");
          const team1Wins = !isNaN(n1) && !isNaN(n2) && n1 > n2;
          const team2Wins = !isNaN(n1) && !isNaN(n2) && n2 > n1;

          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg bg-bg-card-dark"
            >
              {team1Wins && (
                <div className="absolute inset-y-0 left-0 w-1 bg-positive" />
              )}
              {team2Wins && (
                <div className="absolute inset-y-0 right-0 w-1 bg-negative" />
              )}
              <div className="flex items-center px-3 py-2">
                {/* Team 1 — abbreviated if needed */}
                <span
                  className={`text-[13px] w-[70px] truncate ${
                    team1Wins
                      ? "text-positive font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  {team1Name}
                </span>
                {/* Score centered */}
                <div className="flex items-center gap-1 flex-1 justify-center">
                  <span
                    className={`text-[16px] font-semibold tabular-nums ${
                      team1Wins ? "text-positive" : "text-text"
                    }`}
                  >
                    {isNaN(n1) ? "?" : n1}
                  </span>
                  <span className="text-text-secondary text-[12px]">:</span>
                  <span
                    className={`text-[16px] font-semibold tabular-nums ${
                      team2Wins ? "text-negative" : "text-text"
                    }`}
                  >
                    {isNaN(n2) ? "?" : n2}
                  </span>
                </div>
                {/* Team 2 */}
                <span
                  className={`text-[13px] w-[70px] truncate text-right ${
                    team2Wins
                      ? "text-negative font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  {team2Name}
                </span>
              </div>
              <div className="bg-bg/40 px-3 py-0.5 flex justify-between">
                <span className="text-[10px] text-text-secondary/60">
                  {g.date}
                </span>
                <span className="text-[10px] text-text-secondary/60 truncate ml-2">
                  {g.venue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
