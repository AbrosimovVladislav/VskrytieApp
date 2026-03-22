import { getLeagueConfig } from "@/lib/config/leagues";
import { findMatch } from "@/lib/pipeline/steps/find-match";
import type { MatchInfo, MatchClarification } from "@/types/pipeline";

export type PipelineStep = "find-match" | "odds" | "context" | "form" | "analysis";

export interface PipelineProgress {
  step: PipelineStep;
  stepNumber: number;
  status: "in_progress" | "done" | "error";
  error?: string;
}

export type PipelineResult =
  | { type: "found"; match: MatchInfo }
  | { type: "clarification"; clarification: MatchClarification };

export async function runPipeline(
  query: string,
  sport: string,
  leagueId: string,
  onProgress: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  const config = getLeagueConfig(leagueId);

  // Step 1: Find match
  onProgress({ step: "find-match", stepNumber: 1, status: "in_progress" });

  try {
    const result = await findMatch(query, config);

    if (result.type === "clarification") {
      onProgress({ step: "find-match", stepNumber: 1, status: "done" });
      return result;
    }

    onProgress({ step: "find-match", stepNumber: 1, status: "done" });

    // Phase 1: return match info only
    // Steps 2-5 will be added in Phase 2-3
    return { type: "found", match: result.match };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onProgress({ step: "find-match", stepNumber: 1, status: "error", error: message });
    throw error;
  }
}
