import { useCallback } from "react";
import { usePipelineStore } from "@/lib/store/pipeline";

export function useAnalyze() {
  const { startPipeline, setProgress, setMatch, setClarification, setError } =
    usePipelineStore();

  const analyze = useCallback(
    async (query: string, sport: string, league: string) => {
      startPipeline();

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sport, league }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const cleaned = line.replace(/^data: /, "");
            if (!cleaned) continue;

            const data = JSON.parse(cleaned);

            switch (data.type) {
              case "progress":
                setProgress(data.step, data.stepNumber, data.status);
                break;
              case "result":
                setMatch(data.match);
                break;
              case "clarification":
                setClarification({
                  message: data.message,
                  suggestions: data.suggestions,
                });
                break;
              case "error":
                setError(data.error);
                break;
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Network error";
        setError(message);
      }
    },
    [startPipeline, setProgress, setMatch, setClarification, setError],
  );

  return { analyze };
}
