"use client";

import { PipelineStepProgress } from "@/types/pipeline";

const STEP_NAMES = [
  "Поиск матча",
  "Контекст и мотивация",
  "Форма команд",
  "История встреч",
  "Статистика",
  "Кадры и новости",
  "Коэффициенты",
  "Анализ AI",
];

interface PipelineStepperProps {
  steps: PipelineStepProgress[];
}

export function PipelineStepper({ steps }: PipelineStepperProps) {
  function getStepStatus(stepNum: number) {
    const step = steps.find((s) => s.step === stepNum);
    return step?.status ?? "waiting";
  }

  return (
    <div className="flex flex-col items-start gap-0 py-6 px-4">
      {STEP_NAMES.map((name, i) => {
        const stepNum = i + 1;
        const status = getStepStatus(stepNum);
        const isLast = i === STEP_NAMES.length - 1;

        return (
          <div key={stepNum} className="flex items-start gap-3">
            {/* Dot + Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full shrink-0 transition-all duration-300 ${
                  status === "done"
                    ? "bg-accent"
                    : status === "in_progress"
                      ? "bg-accent animate-pulse"
                      : status === "error"
                        ? "bg-negative"
                        : "border border-muted bg-transparent"
                }`}
              />
              {!isLast && (
                <div
                  className={`w-0.5 h-6 transition-all duration-300 ${
                    status === "done" ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm leading-3 transition-colors duration-300 ${
                status === "done"
                  ? "text-accent"
                  : status === "in_progress"
                    ? "text-text"
                    : status === "error"
                      ? "text-negative"
                      : "text-muted"
              }`}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
