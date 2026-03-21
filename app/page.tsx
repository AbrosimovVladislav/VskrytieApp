"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { getAllSports, getLeaguesBySport } from "@/lib/config/leagues";
import {
  MatchInfo,
  MatchClarification,
  PipelineStepProgress,
  PipelineResult,
} from "@/types/pipeline";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { PipelineResult as PipelineResultView } from "@/components/pipeline/pipeline-result";

type AppState =
  | { phase: "input" }
  | { phase: "searching" }
  | { phase: "clarification"; data: MatchClarification }
  | { phase: "match-found"; match: MatchInfo }
  | { phase: "pipeline"; match: MatchInfo; steps: PipelineStepProgress[] }
  | { phase: "result"; result: PipelineResult }
  | { phase: "error"; message: string };

const SPORT_LABELS: Record<string, string> = {
  hockey: "Хоккей",
  football: "Футбол",
  basketball: "Баскетбол",
};

export default function HomePage() {
  const sports = getAllSports();
  const [sport, setSport] = useState(sports[0] || "hockey");
  const leagues = getLeaguesBySport(sport);
  const [league, setLeague] = useState(leagues[0]?.id || "khl");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AppState>({ phase: "input" });

  async function handleSearch() {
    if (!query.trim()) return;

    setState({ phase: "searching" });

    try {
      const res = await fetch("/api/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), sport, league }),
      });

      if (!res.ok) {
        const err = await res.json();
        setState({ phase: "error", message: err.error || "Ошибка поиска" });
        return;
      }

      const data = await res.json();

      if (data.found) {
        setState({ phase: "match-found", match: data.match });
      } else {
        setState({ phase: "clarification", data: data.clarification });
      }
    } catch {
      setState({ phase: "error", message: "Ошибка сети" });
    }
  }

  async function handleStartPipeline(match: MatchInfo) {
    setState({ phase: "pipeline", match, steps: [] });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, league }),
      });

      if (!res.ok) {
        setState({ phase: "error", message: "Ошибка запуска анализа" });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleaned = line.replace(/^data: /, "");
          if (!cleaned) continue;

          const event = JSON.parse(cleaned);

          if (event.type === "progress") {
            setState((prev) => {
              if (prev.phase !== "pipeline") return prev;
              const steps = [...prev.steps];
              const idx = steps.findIndex((s) => s.step === event.step);
              const progress: PipelineStepProgress = {
                step: event.step,
                name: event.name,
                status: event.status,
              };
              if (idx >= 0) steps[idx] = progress;
              else steps.push(progress);
              return { ...prev, steps };
            });
          } else if (event.type === "result") {
            setState({ phase: "result", result: event.data });
          } else if (event.type === "error") {
            setState({ phase: "error", message: event.message });
          }
        }
      }
    } catch {
      setState({ phase: "error", message: "Ошибка соединения" });
    }
  }

  function handleReset() {
    setState({ phase: "input" });
    setQuery("");
  }

  function handleClarificationSelect(suggestion: string) {
    setQuery(suggestion);
    setState({ phase: "input" });
  }

  return (
    <div className="p-4">
      <h1 className="font-display text-xl text-accent mb-6">ВСКРЫТИЕ</h1>

      {/* Input Phase */}
      {(state.phase === "input" || state.phase === "searching") && (
        <div className="flex flex-col gap-4">
          {/* Sport Tabs */}
          <div className="bg-bg-card rounded-[--radius-button] p-[3px] shadow-[--shadow-card] flex">
            {sports.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSport(s);
                  const newLeagues = getLeaguesBySport(s);
                  setLeague(newLeagues[0]?.id || "");
                }}
                className={`flex-1 py-2 text-sm rounded-[--radius-tab] transition-colors ${
                  sport === s
                    ? "bg-accent text-bg-card-dark font-semibold"
                    : "text-muted"
                }`}
              >
                {SPORT_LABELS[s] || s}
              </button>
            ))}
          </div>

          {/* League Select */}
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="bg-bg-card border border-border-secondary rounded-[--radius-button] px-3 py-2.5 text-text text-sm"
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Команда или матч..."
              className="w-full bg-bg-card border border-border-secondary rounded-[--radius-button] pl-9 pr-3 py-2.5 text-text text-sm placeholder:text-muted shadow-[--shadow-light]"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || state.phase === "searching"}
            className="bg-accent text-bg-card-dark font-semibold text-sm h-12 rounded-[--radius-button] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {state.phase === "searching" ? "Ищем матч..." : "Найти матч"}
          </button>
        </div>
      )}

      {/* Clarification Phase */}
      {state.phase === "clarification" && (
        <div className="flex flex-col gap-4">
          <div className="bg-bg-card rounded-[--radius-card] border border-border p-4">
            <p className="text-text-secondary text-sm mb-3">
              {state.data.message}
            </p>
            {state.data.suggestions && state.data.suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {state.data.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleClarificationSelect(s)}
                    className="bg-bg-inner text-text text-sm rounded-[--radius-tab] px-3 py-2 text-left transition-colors hover:bg-accent hover:text-bg-card-dark"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleReset}
            className="text-muted text-sm underline"
          >
            Назад
          </button>
        </div>
      )}

      {/* Match Found Phase */}
      {state.phase === "match-found" && (
        <div className="flex flex-col gap-4">
          <div className="bg-bg-card rounded-[--radius-card] border border-border-accent p-4">
            <h2 className="font-display text-sm text-accent mb-2">
              {state.match.team1} vs {state.match.team2}
            </h2>
            <p className="text-text-secondary text-xs">
              {state.match.league} · {state.match.date} · {state.match.time}
            </p>
            <p className="text-text-secondary text-xs">{state.match.venue}</p>
          </div>
          <button
            onClick={() => handleStartPipeline(state.match)}
            className="bg-accent text-bg-card-dark font-semibold text-sm h-12 rounded-[--radius-button] transition-all active:scale-[0.98]"
          >
            Запустить анализ
          </button>
          <button
            onClick={handleReset}
            className="text-muted text-sm underline"
          >
            Другой матч
          </button>
        </div>
      )}

      {/* Pipeline Phase */}
      {state.phase === "pipeline" && (
        <div>
          <div className="bg-bg-card rounded-[--radius-card] border border-border p-4 mb-4">
            <h2 className="font-display text-xs text-accent mb-1">
              {state.match.team1} vs {state.match.team2}
            </h2>
            <p className="text-text-secondary text-xs">
              Анализируем матч...
            </p>
          </div>
          <PipelineStepper steps={state.steps} />
        </div>
      )}

      {/* Result Phase */}
      {state.phase === "result" && (
        <div>
          <PipelineResultView report={state.result.report} />
          <div className="px-4 pb-4">
            <button
              onClick={handleReset}
              className="w-full bg-bg-card text-text font-semibold text-sm h-12 rounded-[--radius-button] shadow-[--shadow-card] transition-all active:scale-[0.98]"
            >
              Новый анализ
            </button>
          </div>
        </div>
      )}

      {/* Error Phase */}
      {state.phase === "error" && (
        <div className="flex flex-col gap-4">
          <div className="bg-bg-card rounded-[--radius-card] border border-negative/30 p-4">
            <p className="text-negative text-sm">{state.message}</p>
          </div>
          <button
            onClick={handleReset}
            className="bg-bg-card text-text font-semibold text-sm h-12 rounded-[--radius-button] shadow-[--shadow-card]"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
