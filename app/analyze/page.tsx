"use client";

import { useState, useCallback } from "react";
import { PipelineStepProgress, PipelineResult as PipelineResultType } from "@/types/pipeline";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { PipelineResult } from "@/components/pipeline/pipeline-result";
import { getLeaguesBySport, getAllSports } from "@/lib/config/leagues";

type Phase = "input" | "loading" | "result";

export default function AnalyzePage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [sport, setSport] = useState("hockey");
  const [league, setLeague] = useState("khl");
  const [query, setQuery] = useState("");
  const [steps, setSteps] = useState<PipelineStepProgress[]>([]);
  const [result, setResult] = useState<PipelineResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sports = getAllSports();
  const leagues = getLeaguesBySport(sport);

  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) return;

    setPhase("loading");
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sport, league }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start analysis");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "progress") {
            setSteps((prev) => {
              const existing = prev.findIndex((s) => s.step === data.step);
              const updated: PipelineStepProgress = {
                step: data.step,
                name: data.name,
                status: data.status,
              };
              if (existing >= 0) {
                const next = [...prev];
                next[existing] = updated;
                return next;
              }
              return [...prev, updated];
            });
          } else if (data.type === "result") {
            setResult(data.data);
            setPhase("result");
          } else if (data.type === "error") {
            setError(data.message);
            setPhase("input");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("input");
    }
  }, [query, sport, league]);

  if (phase === "loading") {
    return (
      <div className="p-4">
        <h1 className="font-display text-sm text-accent mb-4">АНАЛИЗ</h1>
        <PipelineStepper steps={steps} />
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div>
        <div className="p-4 pb-0">
          <button
            onClick={() => {
              setPhase("input");
              setResult(null);
            }}
            className="text-accent text-sm mb-2"
          >
            &larr; Новый анализ
          </button>
        </div>
        <PipelineResult report={result.report} />
      </div>
    );
  }

  // Input phase
  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-display text-sm text-accent">АНАЛИЗ</h1>

      {error && (
        <div className="bg-negative/10 border border-negative/30 rounded-[--radius-button] p-3">
          <p className="text-negative text-sm">{error}</p>
        </div>
      )}

      {/* Sport tabs */}
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Вид спорта</label>
        <div className="flex gap-2">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSport(s);
                const sportLeagues = getLeaguesBySport(s);
                if (sportLeagues.length > 0) setLeague(sportLeagues[0].id);
              }}
              className={`px-4 py-2 rounded-[--radius-tab] text-sm font-medium transition-colors ${
                sport === s
                  ? "bg-accent text-bg-card-dark"
                  : "bg-bg-card text-muted"
              }`}
            >
              {sportLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* League select */}
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Лига</label>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="w-full bg-bg-card border border-border-secondary rounded-[--radius-button] px-3 py-2.5 text-text text-sm"
        >
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Query input */}
      <div>
        <label className="text-text-secondary text-xs mb-1 block">Запрос</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Команда или матч (напр. ЦСКА)"
          className="w-full bg-bg-card border border-border-secondary rounded-[--radius-button] px-3 py-2.5 text-text text-sm placeholder:text-muted"
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleAnalyze}
        disabled={!query.trim()}
        className="bg-accent text-bg-card-dark font-semibold text-sm h-12 rounded-[--radius-button] disabled:opacity-40 transition-opacity"
      >
        Анализировать
      </button>
    </div>
  );
}

function sportLabel(sport: string): string {
  const labels: Record<string, string> = {
    hockey: "Хоккей",
    football: "Футбол",
    basketball: "Баскетбол",
  };
  return labels[sport] ?? sport;
}
