import { NextRequest, NextResponse } from "next/server";
import { slimSchedule } from "@/utils/espnPayload";

const ESPN_SCHEDULE =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule";

/** Schedule scores are fine a minute behind. Polling is already 30–60s. */
const REVALIDATE_SECONDS = 60;

const CACHE_CONTROL = `public, max-age=30, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`;

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const params = new URLSearchParams();
  const season = incoming.get("season");
  const seasontype = incoming.get("seasontype");
  if (season) params.set("season", season);
  if (seasontype) params.set("seasontype", seasontype);
  const qs = params.toString();

  try {
    const response = await fetch(
      qs ? `${ESPN_SCHEDULE}?${qs}` : ESPN_SCHEDULE,
      {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch schedule" },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    const data = slimSchedule(await response.json());
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
