"use client";

import { ReactNode } from "react";
import { SectionWrapper } from "./section-wrapper";

interface ContextSectionProps {
  team1Name: string;
  team2Name: string;
  team1Analysis: string;
  team2Analysis: string;
  debugSlot?: ReactNode;
}

export function ContextSection({
  team1Name,
  team2Name,
  team1Analysis,
  team2Analysis,
  debugSlot,
}: ContextSectionProps) {
  return (
    <SectionWrapper title="Кадры и контекст" debugSlot={debugSlot}>
      <div className="flex flex-col gap-2">
        <TeamContextCard name={team1Name} text={team1Analysis} />
        <TeamContextCard name={team2Name} text={team2Analysis} />
      </div>
    </SectionWrapper>
  );
}

function TeamContextCard({ name, text }: { name: string; text: string }) {
  // Split text into bullet points by sentence or newline for readability
  const lines = text
    .split(/(?:\n|(?<=\.))\s*/)
    .filter((l) => l.trim().length > 0);

  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <p className="font-medium text-[14px] text-text mb-2">{name}</p>
      <div className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <p key={i} className="text-text-secondary text-[13px] leading-relaxed pl-2 border-l-2 border-border">
            {line.trim()}
          </p>
        ))}
      </div>
    </div>
  );
}
