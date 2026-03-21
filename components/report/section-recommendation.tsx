"use client";

import { RecommendedBet } from "@/types/pipeline";
import { useRef, useEffect, useState } from "react";

interface RecommendationSectionProps {
  summary: string;
  bets: RecommendedBet[];
}

export function RecommendationSection({
  summary,
  bets,
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
      className={`bg-bg-card-dark rounded-[--radius-card] border border-border-accent p-4 transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <h3 className="font-semibold text-accent text-[14px] mb-3">
        РЕКОМЕНДАЦИЯ
      </h3>
      <p className="text-[14px] text-text-secondary mb-4 leading-relaxed">
        {summary}
      </p>
      <div className="flex flex-col gap-3">
        {bets.map((bet, i) => (
          <BetCard key={i} bet={bet} />
        ))}
      </div>
    </div>
  );
}

function BetCard({ bet }: { bet: RecommendedBet }) {
  return (
    <div className="bg-bg-overlay rounded-[12px] p-3 border border-border/50">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-text-secondary text-[12px]">
            {bet.market}:{" "}
          </span>
          <span className="font-display text-accent text-[16px]">
            {bet.pick}
          </span>
        </div>
        <ConfidenceIndicator level={bet.confidence} />
      </div>
      <p className="text-[14px] text-text-secondary leading-relaxed">
        {bet.reasoning}
      </p>
    </div>
  );
}

function ConfidenceIndicator({
  level,
}: {
  level: "high" | "medium" | "low";
}) {
  const config = {
    high: { filled: 3, total: 4, color: "text-positive", label: "HIGH" },
    medium: { filled: 2, total: 4, color: "text-warning", label: "MEDIUM" },
    low: { filled: 1, total: 4, color: "text-negative", label: "LOW" },
  };

  const { filled, total, color, label } = config[level];

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="text-[10px]">
            {i < filled ? "●" : "○"}
          </span>
        ))}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="text-muted text-[12px] text-center px-4 py-2">
      Данные носят информационный характер. Сервис не несёт ответственности за
      результаты ставок. Решение всегда за вами.
    </p>
  );
}
