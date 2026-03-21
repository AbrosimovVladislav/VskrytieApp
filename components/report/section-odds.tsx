"use client";

import { ReactNode } from "react";
import { BookmakerOdds } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface OddsSectionProps {
  bookmakers: BookmakerOdds[];
  analysis: string;
  debugSlot?: ReactNode;
}

type OddsField =
  | "outcome_home"
  | "outcome_draw"
  | "outcome_away"
  | "total_over"
  | "total_under";

const ODDS_FIELDS: { key: OddsField; label: string }[] = [
  { key: "outcome_home", label: "П1" },
  { key: "outcome_draw", label: "X" },
  { key: "outcome_away", label: "П2" },
  { key: "total_over", label: "ТБ" },
  { key: "total_under", label: "ТМ" },
];

export function OddsSection({
  bookmakers,
  analysis,
  debugSlot,
}: OddsSectionProps) {
  // Find best (max) odds per field
  const bestOdds: Record<string, number> = {};
  for (const f of ODDS_FIELDS) {
    bestOdds[f.key] = Math.max(...bookmakers.map((b) => b[f.key]));
  }

  return (
    <SectionWrapper title="Коэффициенты" analysis={analysis} debugSlot={debugSlot}>
      <div className="flex flex-col gap-2">
        {bookmakers.map((bk) => (
          <div
            key={bk.name}
            className="bg-bg-card-dark rounded-[12px] p-2.5"
          >
            <p className="text-text text-[13px] font-medium mb-1.5">
              {bk.name}
            </p>
            <div className="flex gap-1">
              {ODDS_FIELDS.map((f) => {
                const val = bk[f.key];
                const isBest = val === bestOdds[f.key];
                return (
                  <div
                    key={f.key}
                    className="flex-1 text-center"
                  >
                    <p className="text-text-secondary text-[10px] mb-0.5">
                      {f.label}
                    </p>
                    <p
                      className={`font-display text-[13px] tabular-nums ${
                        isBest ? "text-accent font-semibold" : "text-text"
                      }`}
                    >
                      {val.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
