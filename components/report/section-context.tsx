"use client";

import { ReactNode } from "react";
import { TeamSquadContext } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface ContextSectionProps {
  team1Name: string;
  team2Name: string;
  team1Squad: TeamSquadContext;
  team2Squad: TeamSquadContext;
  team1Analysis: string;
  team2Analysis: string;
  debugSlot?: ReactNode;
}

export function ContextSection({
  team1Name,
  team2Name,
  team1Squad,
  team2Squad,
  team1Analysis,
  team2Analysis,
  debugSlot,
}: ContextSectionProps) {
  return (
    <SectionWrapper title="Кадры и контекст" debugSlot={debugSlot}>
      <div className="flex flex-col gap-2">
        <TeamContextCard name={team1Name} squad={team1Squad} analysis={team1Analysis} />
        <TeamContextCard name={team2Name} squad={team2Squad} analysis={team2Analysis} />
      </div>
    </SectionWrapper>
  );
}

interface ContextItem {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}

function TeamContextCard({
  name,
  squad,
  analysis,
}: {
  name: string;
  squad: TeamSquadContext;
  analysis: string;
}) {
  const items: ContextItem[] = [];

  if (squad.injuries && squad.injuries.trim()) {
    const hasInjuries = !squad.injuries.toLowerCase().includes("нет") &&
                        !squad.injuries.toLowerCase().includes("без");
    items.push({
      icon: "🏥",
      label: "Травмы",
      value: squad.injuries,
      accent: hasInjuries,
    });
  }

  if (squad.media_summary && squad.media_summary.trim()) {
    items.push({
      icon: "📰",
      label: "Медиа",
      value: squad.media_summary,
    });
  }

  if (squad.rotation_expected && squad.rotation_expected.trim()) {
    items.push({
      icon: "🔄",
      label: "Ротация",
      value: squad.rotation_expected,
    });
  }

  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <p className="font-medium text-[14px] text-text mb-2.5">{name}</p>

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[14px] shrink-0 mt-0.5">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] text-text-secondary mb-0.5">{item.label}</p>
                <p className={`text-[13px] leading-relaxed ${
                  item.accent ? "text-warning" : "text-text-secondary"
                }`}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-secondary text-[13px] leading-relaxed pl-2 border-l-2 border-border">
          {analysis}
        </p>
      )}
    </div>
  );
}
