import { create } from "zustand";
import type { MatchInfo, MatchClarification } from "@/types/pipeline";
import type { PipelineStep } from "@/lib/pipeline/orchestrator";

type PipelineStatus = "idle" | "loading" | "found" | "clarification" | "error";

interface PipelineState {
  status: PipelineStatus;
  currentStep: number;
  completedSteps: PipelineStep[];
  match: MatchInfo | null;
  clarification: MatchClarification | null;
  error: string | null;

  // Form state
  sport: string;
  league: string;
  query: string;

  setForm: (sport: string, league: string, query: string) => void;
  startPipeline: () => void;
  setProgress: (step: PipelineStep, stepNumber: number, status: string) => void;
  setMatch: (match: MatchInfo) => void;
  setClarification: (clarification: MatchClarification) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  status: "idle",
  currentStep: 0,
  completedSteps: [],
  match: null,
  clarification: null,
  error: null,
  sport: "hockey",
  league: "khl",
  query: "",

  setForm: (sport, league, query) => set({ sport, league, query }),

  startPipeline: () =>
    set({
      status: "loading",
      currentStep: 0,
      completedSteps: [],
      match: null,
      clarification: null,
      error: null,
    }),

  setProgress: (step, stepNumber, status) =>
    set((state) => ({
      currentStep: stepNumber,
      completedSteps:
        status === "done" && !state.completedSteps.includes(step)
          ? [...state.completedSteps, step]
          : state.completedSteps,
    })),

  setMatch: (match) => set({ status: "found", match }),

  setClarification: (clarification) =>
    set({ status: "clarification", clarification }),

  setError: (error) => set({ status: "error", error }),

  reset: () =>
    set({
      status: "idle",
      currentStep: 0,
      completedSteps: [],
      match: null,
      clarification: null,
      error: null,
      query: "",
    }),
}));
