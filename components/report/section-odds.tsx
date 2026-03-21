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
      {/* Grid table: header row + bookmaker rows */}
      <div className="bg-bg-card-dark rounded-[12px] overflow-hidden">
        {/* Header */}
        <div className="flex px-3 py-2 border-b border-border/30">
          <div className="w-[80px] shrink-0" />
          {ODDS_FIELDS.map((f) => (
            <div key={f.key} className="flex-1 text-center">
              <span className="text-text-secondary text-[10px] uppercase">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {bookmakers.map((bk, idx) => (
          <div
            key={bk.name}
            className={`flex items-center px-3 py-2 ${
              idx < bookmakers.length - 1 ? "border-b border-border/15" : ""
            }`}
          >
            <div className="w-[80px] shrink-0">
              <span className="text-text text-[12px] font-medium">{bk.name}</span>
            </div>
            {ODDS_FIELDS.map((f) => {
              const val = bk[f.key];
              const isBest = val === bestOdds[f.key];
              return (
                <div key={f.key} className="flex-1 text-center">
                  <span
                    className={`font-display text-[12px] tabular-nums ${
                      isBest ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    {val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
