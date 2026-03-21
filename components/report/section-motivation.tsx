"use client";

import { ReactNode } from "react";
import { SectionWrapper } from "./section-wrapper";

interface MotivationSectionProps {
  team1Name: string;
  team2Name: string;
  team1Data: string;
  team2Data: string;
  analysis: string;
  debugSlot?: ReactNode;
}

export function MotivationSection({
  team1Name,
  team2Name,
  team1Data,
  team2Data,
  analysis,
  debugSlot,
}: MotivationSectionProps) {
  return (
    <SectionWrapper title="Мотивация" analysis={analysis} debugSlot={debugSlot}>
      <div className="flex flex-col gap-2">
        <TeamMotivationCard name={team1Name} data={team1Data} />
        <TeamMotivationCard name={team2Name} data={team2Data} />
      </div>
    </SectionWrapper>
  );
}

function TeamMotivationCard({ name, data }: { name: string; data: string }) {
  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <p className="font-medium text-[14px] text-text mb-1">{name}</p>
      <p className="text-text-secondary text-[13px] leading-relaxed">{data}</p>
    </div>
  );
}
