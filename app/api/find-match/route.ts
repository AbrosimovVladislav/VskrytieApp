import { NextRequest } from "next/server";
import { getLeagueConfig } from "@/lib/config/leagues";
import { findMatch } from "@/lib/pipeline/steps/find-match";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, sport, league } = body;

  if (!query || !sport || !league) {
    return Response.json(
      { error: "Missing required fields: query, sport, league" },
      { status: 400 }
    );
  }

  try {
    const leagueConfig = getLeagueConfig(league);
    const result = await findMatch({ query, sport, leagueConfig });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
