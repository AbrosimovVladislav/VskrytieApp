"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Поиск матча" },
  { label: "Коэффициенты" },
  { label: "Контекст" },
  { label: "Форма команд" },
  { label: "Анализ AI" },
] as const;

interface PipelineLoaderProps {
  currentStep: number; // 1-5
  completedCount: number;
}

export function PipelineLoader({ currentStep, completedCount }: PipelineLoaderProps) {
  return (
    <div className="flex flex-col gap-0 py-8 px-4">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum <= completedCount;
        const isCurrent = stepNum === currentStep;
        const isPending = stepNum > currentStep;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.label} className="flex items-start gap-3">
            {/* Dot + Line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "size-3 rounded-full shrink-0 transition-all duration-300",
                  isDone && "bg-accent",
                  isCurrent && "bg-accent animate-pulse",
                  isPending && "border border-muted bg-transparent",
                )}
              />
              {!isLast && (
                <div
                  className={cn(
                    "w-px h-8 transition-colors duration-300",
                    isDone ? "bg-accent" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-[13px] -mt-0.5 transition-colors duration-300",
                isDone && "text-accent font-medium",
                isCurrent && "text-text font-medium",
                isPending && "text-muted",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
