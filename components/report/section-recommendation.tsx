"use client";

import { ReactNode } from "react";
import { RecommendedBet } from "@/types/pipeline";
import { useRef, useEffect, useState } from "react";

interface RecommendationSectionProps {
  summary: string;
  bets: RecommendedBet[];
  debugSlot?: ReactNode;
}

export function RecommendationSection({
  summary,
  bets,
  debugSlot,
}: RecommendationSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-bg-card-dark rounded-[--radius-card] border border-border-accent p-3 transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <h3 className="font-semibold text-accent text-[14px] mb-3">
        РЕКОМЕНДАЦИЯ
      </h3>
      <p className="text-accent text-[13px] italic leading-relaxed mb-4">
        {summary}
      </p>
      <div className="flex flex-col gap-3">
        {bets.map((bet, i) => (
          <BetCard key={i} bet={bet} />
        ))}
      </div>
      {debugSlot}
    </div>
  );
}

function BetCard({ bet }: { bet: RecommendedBet }) {
  const confidenceConfig = {
    high: { filled: 3, total: 4, color: "text-positive", label: "HIGH" },
    medium: { filled: 2, total: 4, color: "text-warning", label: "MEDIUM" },
    low: { filled: 1, total: 4, color: "text-negative", label: "LOW" },
  };

  const conf = confidenceConfig[bet.confidence];

  return (
    <div className="bg-bg-overlay rounded-[12px] p-3 border border-border/50">
      {/* Top row: market label */}
      <p className="text-text-secondary text-[12px] mb-1">{bet.market}</p>
      {/* Pick + confidence on same row */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-accent text-[16px]">
          {bet.pick}
        </span>
        <div className={`flex items-center gap-1.5 ${conf.color}`}>
          <div className="flex gap-0.5">
            {Array.from({ length: conf.total }, (_, i) => (
              <span key={i} className="text-[10px]">
                {i < conf.filled ? "●" : "○"}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-medium">{conf.label}</span>
        </div>
      </div>
      {/* Reasoning */}
      <p className="text-text-secondary text-[13px] leading-relaxed">
        {bet.reasoning}
      </p>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="text-muted text-[12px] text-center py-2">
      Данные носят информационный характер. Сервис не несёт ответственности за
      результаты ставок. Решение всегда за вами.
    </p>
  );
}
