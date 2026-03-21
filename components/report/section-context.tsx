"use client";

import { SectionWrapper } from "./section-wrapper";

interface ContextSectionProps {
  team1Name: string;
  team2Name: string;
  team1Analysis: string;
  team2Analysis: string;
}

export function ContextSection({
  team1Name,
  team2Name,
  team1Analysis,
  team2Analysis,
}: ContextSectionProps) {
  return (
    <SectionWrapper title="Контекст">
      <div className="flex flex-col gap-2">
        <TeamContextCard name={team1Name} text={team1Analysis} />
        <TeamContextCard name={team2Name} text={team2Analysis} />
      </div>
    </SectionWrapper>
  );
}

function TeamContextCard({ name, text }: { name: string; text: string }) {
  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <p className="font-semibold text-[16px] text-text mb-1">{name}</p>
      <p className="text-text-secondary text-[14px] leading-relaxed">{text}</p>
    </div>
  );
}
