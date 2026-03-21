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
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-5 text-center animate-fade-in">
      <p className="text-text-secondary text-[12px] mb-3 uppercase tracking-wider">
        {league}
      </p>
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="font-display text-xl text-text">{team1}</span>
        <span className="text-muted text-[14px]">vs</span>
        <span className="font-display text-xl text-text">{team2}</span>
      </div>
      <p className="text-text-secondary text-[14px]">
        {date} · {time}
      </p>
      <p className="text-text-secondary text-[14px]">{venue}</p>
    </div>
  );
}
