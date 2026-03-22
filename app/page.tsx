"use client";

import { usePipelineStore } from "@/lib/store/pipeline";
import { useAnalyze } from "@/lib/hooks/use-analyze";
import { SportSelector } from "@/components/form/sport-selector";
import { LeagueSelector } from "@/components/form/league-selector";
import { SearchInput } from "@/components/form/search-input";
import { PipelineLoader } from "@/components/report/pipeline-loader";
import { MatchFound } from "@/components/report/match-found";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const {
    status,
    sport,
    league,
    query,
    currentStep,
    completedSteps,
    match,
    clarification,
    error,
    setForm,
    reset,
  } = usePipelineStore();
  const { analyze } = useAnalyze();

  const isIdle = status === "idle";
  const isLoading = status === "loading";

  function handleSubmit() {
    if (!query.trim()) return;
    analyze(query.trim(), sport, league);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <h1 className="font-display text-xl text-accent">ВСКРЫТИЕ</h1>
        <p className="text-text-secondary text-[13px] mt-1">
          Аналитический помощник для беттора
        </p>
      </div>

      {/* Form */}
      {(isIdle || isLoading) && (
        <div className="px-4 flex flex-col gap-4">
          <div>
            <label className="text-text-secondary text-[12px] mb-1.5 block">Спорт</label>
            <SportSelector
              value={sport}
              onChange={(s) => setForm(s, league, query)}
            />
          </div>

          <div>
            <label className="text-text-secondary text-[12px] mb-1.5 block">Лига</label>
            <LeagueSelector
              sport={sport}
              value={league}
              onChange={(l) => setForm(sport, l, query)}
            />
          </div>

          <div>
            <label className="text-text-secondary text-[12px] mb-1.5 block">Команда</label>
            <SearchInput
              value={query}
              onChange={(q) => setForm(sport, league, q)}
              onSubmit={handleSubmit}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="w-full h-12 rounded-[--radius-button] bg-accent text-bg-card-dark font-semibold text-[14px] disabled:opacity-40"
          >
            {isLoading ? "Ищем..." : "Анализировать"}
          </Button>
        </div>
      )}

      {/* Loading: Pipeline stepper */}
      {isLoading && (
        <PipelineLoader
          currentStep={currentStep}
          completedCount={completedSteps.length}
        />
      )}

      {/* Result: Match found */}
      {status === "found" && match && (
        <div className="px-4 pt-4 flex flex-col gap-4">
          <MatchFound match={match} />
          <p className="text-text-secondary text-[12px] text-center">
            Матч найден. Шаги 2–5 будут добавлены в следующих фазах.
          </p>
          <Button
            onClick={reset}
            variant="outline"
            className="w-full h-10 rounded-[--radius-button]"
          >
            Новый анализ
          </Button>
        </div>
      )}

      {/* Clarification: match not found */}
      {status === "clarification" && clarification && (
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="bg-bg-card rounded-[--radius-card] border border-border p-4">
            <p className="text-warning text-[14px] font-medium mb-2">
              Уточнение
            </p>
            <p className="text-text text-[13px]">{clarification.message}</p>
            {clarification.suggestions && clarification.suggestions.length > 0 && (
              <div className="flex flex-col gap-2 mt-3">
                {clarification.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setForm(sport, league, s);
                      analyze(s, sport, league);
                    }}
                    className="text-left text-accent text-[13px] hover:underline"
                  >
                    → {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={reset}
            variant="outline"
            className="w-full h-10 rounded-[--radius-button]"
          >
            Назад
          </Button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="bg-bg-card rounded-[--radius-card] border border-negative/30 p-4">
            <p className="text-negative text-[14px] font-medium mb-1">Ошибка</p>
            <p className="text-text-secondary text-[13px]">{error}</p>
          </div>
          <Button
            onClick={reset}
            variant="outline"
            className="w-full h-10 rounded-[--radius-button]"
          >
            Попробовать снова
          </Button>
        </div>
      )}
    </div>
  );
}
