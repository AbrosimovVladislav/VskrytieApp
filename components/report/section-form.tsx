"use client";

import { ReactNode } from "react";
import { GameResult } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface FormSectionProps {
  team1Name: string;
  team2Name: string;
  team1Games: GameResult[];
  team2Games: GameResult[];
  analysis: string;
  debugSlot?: ReactNode;
}

export function FormSection({
  team1Name,
  team2Name,
  team1Games,
  team2Games,
  analysis,
  debugSlot,
}: FormSectionProps) {
  return (
    <SectionWrapper
      title="Форма (последние 5 матчей)"
      analysis={analysis}
      debugSlot={debugSlot}
    >
      <div className="flex flex-col gap-3">
        <TeamForm teamName={team1Name} games={team1Games} />
        <TeamForm teamName={team2Name} games={team2Games} />
      </div>
    </SectionWrapper>
  );
}

function TeamForm({
  teamName,
  games,
}: {
  teamName: string;
  games: GameResult[];
}) {
  const wins = games.filter(
    (g) => g.result === "W" || g.result === "OTW"
  ).length;
  const losses = games.filter(
    (g) => g.result === "L" || g.result === "OTL"
  ).length;

  return (
    <div className="bg-bg-card-dark rounded-[12px] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text font-medium text-[14px]">{teamName}</span>
        <span className="text-text-secondary text-[12px]">
          {wins}В {losses}П
        </span>
      </div>
      <div className="flex gap-2">
        {games.map((g, i) => (
          <ResultDot key={i} result={g.result} />
        ))}
      </div>
    </div>
  );
}

function ResultDot({ result }: { result: GameResult["result"] }) {
  const config: Record<
    GameResult["result"],
    { bg: string; label: string }
  > = {
    W: { bg: "bg-positive", label: "В" },
    L: { bg: "bg-negative", label: "П" },
    OTW: { bg: "bg-positive opacity-60", label: "ОТВ" },
    OTL: { bg: "bg-negative opacity-60", label: "ОТП" },
  };

  const { bg, label } = config[result];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-3 h-3 rounded-full ${bg}`} />
      <span className="text-[10px] text-text-secondary">{label}</span>
    </div>
  );
}
