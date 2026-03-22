"use client";

import { cn } from "@/lib/utils";

interface League {
  id: string;
  name: string;
}

const LEAGUES_BY_SPORT: Record<string, League[]> = {
  hockey: [{ id: "khl", name: "КХЛ" }],
};

interface LeagueSelectorProps {
  sport: string;
  value: string;
  onChange: (league: string) => void;
}

export function LeagueSelector({ sport, value, onChange }: LeagueSelectorProps) {
  const leagues = LEAGUES_BY_SPORT[sport] ?? [];

  if (leagues.length === 0) return null;

  return (
    <div className="flex gap-2">
      {leagues.map((league) => (
        <button
          key={league.id}
          type="button"
          onClick={() => onChange(league.id)}
          className={cn(
            "px-4 py-2 rounded-[--radius-tab] text-[14px] font-medium transition-colors",
            value === league.id
              ? "bg-bg-inner text-text"
              : "bg-bg-card text-muted hover:text-text",
          )}
        >
          {league.name}
        </button>
      ))}
    </div>
  );
}
