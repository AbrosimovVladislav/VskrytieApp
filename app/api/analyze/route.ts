import { runPipeline, type PipelineProgress } from "@/lib/pipeline/orchestrator";

export async function POST(req: Request) {
  const body = await req.json();
  const { query, sport, league } = body as {
    query: string;
    sport: string;
    league: string;
  };

  if (!query || !sport || !league) {
    return Response.json(
      { error: "Missing required fields: query, sport, league" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      function onProgress(progress: PipelineProgress) {
        send({ type: "progress", ...progress });
      }

      try {
        const result = await runPipeline(query, sport, league, onProgress);

        if (result.type === "found") {
          send({ type: "result", match: result.match });
        } else {
          send({ type: "clarification", ...result.clarification });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pipeline error";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
