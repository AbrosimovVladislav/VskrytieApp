"use client";

import { GameResult } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface FormSectionProps {
  team1Name: string;
  team2Name: string;
  team1Games: GameResult[];
  team2Games: GameResult[];
  analysis: string;
}

export function FormSection({
  team1Name,
  team2Name,
  team1Games,
  team2Games,
  analysis,
}: FormSectionProps) {
  return (
    <SectionWrapper title="Форма" analysis={analysis}>
      <div className="flex flex-col gap-4">
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
  const summary = summarizeResults(games);

  return (
    <div>
      {/* Team name + dots row */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-text font-medium text-[14px]">{teamName}:</span>
        <div className="flex gap-1.5">
          {games.map((g, i) => (
            <ResultDot key={i} result={g.result} />
          ))}
        </div>
        <span className="text-text-secondary text-[12px] ml-auto">
          {summary}
        </span>
      </div>

      {/* Match list */}
      <div className="flex flex-col gap-1">
        {games.map((g, i) => (
          <div
            key={i}
            className="flex items-center text-[14px] py-0.5"
          >
            <span className="text-text-secondary w-[50px] shrink-0">
              {g.date}
            </span>
            <span className="text-text flex-1 truncate">
              {g.opponent}{" "}
              <span className="text-text-secondary">
                ({g.home ? "Д" : "В"})
              </span>
            </span>
            <span className="text-text tabular-nums w-[36px] text-center">
              {g.score}
            </span>
            <ResultBadge result={g.result} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultDot({ result }: { result: GameResult["result"] }) {
  const styles: Record<GameResult["result"], string> = {
    W: "bg-positive",
    L: "bg-negative",
    OTW: "bg-positive opacity-60",
    OTL: "bg-negative opacity-60",
  };

  return <div className={`w-2 h-2 rounded-full ${styles[result]}`} />;
}

function ResultBadge({ result }: { result: GameResult["result"] }) {
  const styles: Record<GameResult["result"], string> = {
    W: "text-positive",
    L: "text-negative",
    OTW: "text-positive opacity-60",
    OTL: "text-negative opacity-60",
  };

  return (
    <span
      className={`text-[12px] font-medium w-[28px] text-right ${styles[result]}`}
    >
      {result}
    </span>
  );
}

function summarizeResults(games: GameResult[]): string {
  const w = games.filter((g) => g.result === "W" || g.result === "OTW").length;
  const l = games.filter((g) => g.result === "L" || g.result === "OTL").length;
  const parts: string[] = [];
  if (w > 0) parts.push(`${w}В`);
  if (l > 0) parts.push(`${l}П`);
  return `(${parts.join(" ")})`;
}
