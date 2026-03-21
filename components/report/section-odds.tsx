"use client";

import { BookmakerOdds } from "@/types/pipeline";
import { SectionWrapper } from "./section-wrapper";

interface OddsSectionProps {
  bookmakers: BookmakerOdds[];
  analysis: string;
}

type OddsField = "outcome_home" | "outcome_draw" | "outcome_away" | "total_over" | "total_under";

const ODDS_COLUMNS: { key: OddsField; label: string }[] = [
  { key: "outcome_home", label: "П1" },
  { key: "outcome_draw", label: "X" },
  { key: "outcome_away", label: "П2" },
  { key: "total_over", label: "ТБ" },
  { key: "total_under", label: "ТМ" },
];

export function OddsSection({ bookmakers, analysis }: OddsSectionProps) {
  // Find best (max) odds per column
  const bestOdds: Record<string, number> = {};
  for (const col of ODDS_COLUMNS) {
    bestOdds[col.key] = Math.max(...bookmakers.map((b) => b[col.key]));
  }

  return (
    <SectionWrapper title="Коэффициенты" analysis={analysis}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-text-secondary text-[12px] font-semibold pb-2 pr-2" />
              {ODDS_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="text-center text-text-secondary text-[12px] font-semibold pb-2 px-1"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookmakers.map((bk) => (
              <tr key={bk.name} className="border-t border-border/50">
                <td className="text-text text-[14px] py-1.5 pr-2 whitespace-nowrap">
                  {bk.name}
                </td>
                {ODDS_COLUMNS.map((col) => {
                  const val = bk[col.key];
                  const isBest = val === bestOdds[col.key];
                  return (
                    <td
                      key={col.key}
                      className={`text-center py-1.5 px-1 font-display text-[14px] tabular-nums ${
                        isBest
                          ? "text-accent font-semibold"
                          : "text-text"
                      }`}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
