import { NextRequest, NextResponse } from "next/server";
import { slimSummary } from "@/utils/espnPayload";

const ESPN_SUMMARY =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary";

/** Live scores. Short enough that a 30s poll still sees a new snapshot. */
const REVALIDATE_SECONDS = 15;

const CACHE_CONTROL = `public, max-age=10, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`;

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId;
  if (!eventId || !/^\d+$/.test(eventId)) {
    return NextResponse.json(
      { error: "Missing event id" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const view = request.nextUrl.searchParams.get("view");

  try {
    const response = await fetch(
      `${ESPN_SUMMARY}?event=${encodeURIComponent(eventId)}`,
      {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch game" },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    const data = slimSummary(await response.json(), view);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
