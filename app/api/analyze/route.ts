import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { PipelineInput, PipelineStepProgress } from "@/types/pipeline";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PipelineInput;

  if (!body.query || !body.sport || !body.league) {
    return Response.json(
      { error: "Missing required fields: query, sport, league" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const result = await runPipeline(body, (progress: PipelineStepProgress) => {
          send({ type: "progress", ...progress });
        });

        send({ type: "result", data: result });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
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
