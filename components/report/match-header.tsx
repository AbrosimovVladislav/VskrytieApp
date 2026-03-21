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
  // Adaptive font size: shorter names get larger text
  const maxLen = Math.max(team1.length, team2.length);
  const fontSize = maxLen > 14 ? "text-[14px]" : maxLen > 10 ? "text-[16px]" : "text-[18px]";

  return (
    <div className="bg-bg-card rounded-[--radius-card] border border-border p-4 text-center animate-fade-in">
      <p className="text-text-secondary text-[12px] mb-3 uppercase tracking-wider">
        {league}
      </p>
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className={`font-semibold ${fontSize} text-text text-center flex-1 min-w-0 wrap-break-word`}>
          {team1}
        </span>
        <span className="text-muted text-[14px] shrink-0">vs</span>
        <span className={`font-semibold ${fontSize} text-text text-center flex-1 min-w-0 wrap-break-word`}>
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
