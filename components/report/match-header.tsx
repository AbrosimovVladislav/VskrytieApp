"use client";

interface MatchHeaderProps {
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  league: string;
}

export function MatchHeader({
  team1,
  team2,
  date,
  time,
  venue,
  league,
}: MatchHeaderProps) {
  return (
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-4 text-center animate-fade-in">
      <p className="text-text-secondary text-[12px] mb-3 uppercase tracking-wider">
        {league}
      </p>
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-semibold text-[18px] text-text truncate max-w-[40%]">
          {team1}
        </span>
        <span className="text-muted text-[14px] shrink-0">vs</span>
        <span className="font-semibold text-[18px] text-text truncate max-w-[40%]">
          {team2}
        </span>
      </div>
      <p className="text-text-secondary text-[13px]">
        {date} · {time}
      </p>
      <p className="text-text-secondary text-[13px]">{venue}</p>
    </div>
  );
}
