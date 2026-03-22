"use client";

import { cn } from "@/lib/utils";

const SPORTS = [
  { id: "hockey", label: "Хоккей", icon: "🏒" },
] as const;

interface SportSelectorProps {
  value: string;
  onChange: (sport: string) => void;
}

export function SportSelector({ value, onChange }: SportSelectorProps) {
  return (
    <div className="flex gap-2">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => onChange(sport.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-[--radius-tab] text-[14px] font-medium transition-colors",
            value === sport.id
              ? "bg-accent text-bg-card-dark"
              : "bg-bg-card text-muted hover:text-text",
          )}
        >
          <span>{sport.icon}</span>
          {sport.label}
        </button>
      ))}
    </div>
  );
}
