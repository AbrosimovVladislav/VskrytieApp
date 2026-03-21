"use client";

import { ReactNode } from "react";
import { TeamMotivation } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface MotivationSectionProps {
  team1Name: string;
  team2Name: string;
  team1: TeamMotivation;
  team2: TeamMotivation;
  stage: string;
  analysis: string;
  debugSlot?: ReactNode;
}

const PRIORITY_CONFIG: Record<string, { level: number; color: string; label: string }> = {
  максимальный: { level: 3, color: "bg-positive", label: "MAX" },
  высокий: { level: 3, color: "bg-positive", label: "HIGH" },
  высок: { level: 3, color: "bg-positive", label: "HIGH" },
  средний: { level: 2, color: "bg-warning", label: "MED" },
  низкий: { level: 1, color: "bg-negative", label: "LOW" },
  низк: { level: 1, color: "bg-negative", label: "LOW" },
};

function parsePriority(priority: string): { level: number; color: string; label: string } {
  const lower = priority.toLowerCase();
  for (const [key, config] of Object.entries(PRIORITY_CONFIG)) {
    if (lower.includes(key)) return config;
  }
  return { level: 2, color: "bg-warning", label: "MED" };
}

export function MotivationSection({
  team1Name,
  team2Name,
  team1,
  team2,
  stage,
  analysis,
  debugSlot,
}: MotivationSectionProps) {
  return (
    <SectionWrapper title="Мотивация" analysis={analysis} debugSlot={debugSlot}>
      {/* Stage badge */}
      {stage && (
        <div className="mb-3">
          <span className="text-[11px] text-text-secondary bg-white-8 px-2 py-1 rounded-[5px]">
            {stage}
          </span>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-2">
        <MotivationCard name={team1Name} data={team1} />
        <MotivationCard name={team2Name} data={team2} />
      </div>
    </SectionWrapper>
  );
}

function MotivationCard({ name, data }: { name: string; data: TeamMotivation }) {
  const priority = parsePriority(data.priority);

  // Extract position number if available
  const posMatch = data.position.match(/(\d+)/);
  const posNumber = posMatch ? posMatch[1] : null;

  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3 flex flex-col gap-2.5">
      {/* Team name */}
      <p className="font-medium text-[13px] text-text leading-tight">{name}</p>

      {/* Position badge — big number */}
      <div className="flex items-center gap-2">
        {posNumber && (
          <div className="w-9 h-9 rounded-lg bg-bg-overlay flex items-center justify-center border border-border/50">
            <span className="font-display text-[14px] text-accent">{posNumber}</span>
          </div>
        )}
        <span className="text-text-secondary text-[11px] leading-tight flex-1">
          {data.position}
        </span>
      </div>

      {/* Fighting for — tag */}
      <div>
        <span className="text-[11px] text-accent bg-accent-dim px-2 py-0.5 rounded-tag leading-none">
          {data.fighting_for}
        </span>
      </div>

      {/* Priority meter */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-1.5 rounded-full ${
                i <= priority.level ? priority.color : "bg-border"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-text-secondary">{priority.label}</span>
      </div>
    </div>
  );
}
