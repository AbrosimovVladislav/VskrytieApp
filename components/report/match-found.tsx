"use client";

import type { MatchInfo } from "@/types/pipeline";

interface MatchFoundProps {
  match: MatchInfo;
}

export function MatchFound({ match }: MatchFoundProps) {
  return (
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-4 shadow-[--shadow-card]">
      {/* League badge */}
      <div className="flex justify-center mb-4">
        <span className="bg-white-8 px-2 py-0.5 rounded-[5px] text-text-secondary text-[12px]">
          {match.league}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-text font-medium text-[16px]">{match.team1}</p>
        </div>
        <span className="font-display text-[12px] text-muted">VS</span>
        <div className="flex-1 text-center">
          <p className="text-text font-medium text-[16px]">{match.team2}</p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex justify-center gap-3 mt-4 text-text-secondary text-[12px]">
        <span>{match.date}</span>
        <span>{match.time}</span>
      </div>
    </div>
  );
}
