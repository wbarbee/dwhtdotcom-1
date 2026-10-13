import { NextRequest, NextResponse } from "next/server";
import { slimSummary } from "@/utils/espnPayload";
import { bustEdgeCache } from "@/utils/espnLive";

const ESPN_SUMMARY =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary";

/** Live scores. Short enough that a 30s poll still sees a new snapshot. */
const REVALIDATE_SECONDS = 15;

const CACHE_CONTROL = `public, max-age=10, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`;

/** The header view is the live-score fallback: no stale copies anywhere. */
const LIVE_CACHE_CONTROL = "public, max-age=0, s-maxage=5";

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
    const isLive = view === "header";
    const url = `${ESPN_SUMMARY}?event=${encodeURIComponent(eventId)}`;
    const response = await fetch(
      isLive ? bustEdgeCache(url) : url,
      {
        ...(isLive
          ? { cache: "no-store" as const }
          : { next: { revalidate: REVALIDATE_SECONDS } }),
        headers: { Accept: "application/json" },
        // A live summary is large and ESPN is slow on gamedays. This also bounds
        // reading the body, so keep it under the client's 10s abort but not tight.
        signal: AbortSignal.timeout(9_000),
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch game" },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    const data = slimSummary(await response.json(), view);
    const cacheControl = isLive ? LIVE_CACHE_CONTROL : CACHE_CONTROL;
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
        "Vercel-CDN-Cache-Control": cacheControl,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
