"use client";

import { H2HGame } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface H2HSectionProps {
  team1Name: string;
  team2Name: string;
  games: H2HGame[];
  analysis: string;
}

export function H2HSection({
  team1Name,
  team2Name,
  games,
  analysis,
}: H2HSectionProps) {
  return (
    <SectionWrapper title={`Встречи в сезоне (${games.length})`} analysis={analysis}>
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
              <div className="flex items-center px-3 py-2.5">
                <span
                  className={`text-[14px] flex-1 truncate ${
                    team1Wins
                      ? "text-positive font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  {team1Name}
                </span>
                <div className="flex items-center gap-1.5 mx-3">
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      team1Wins ? "text-positive" : "text-text"
                    }`}
                  >
                    {isNaN(n1) ? "?" : n1}
                  </span>
                  <span className="text-text-secondary text-[12px]">:</span>
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      team2Wins ? "text-negative" : "text-text"
                    }`}
                  >
                    {isNaN(n2) ? "?" : n2}
                  </span>
                </div>
                <span
                  className={`text-[14px] flex-1 truncate text-right ${
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
                <span className="text-[10px] text-text-secondary/60">
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
