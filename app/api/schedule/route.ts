import { NextRequest, NextResponse } from "next/server";
import { slimSchedule } from "@/utils/espnPayload";

const ESPN_SCHEDULE =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule";

/** Schedule scores are fine a minute behind. Polling is already 30–60s. */
const REVALIDATE_SECONDS = 60;

const CACHE_CONTROL = `public, max-age=30, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`;

const cacheHeaders = {
  "Cache-Control": CACHE_CONTROL,
  "CDN-Cache-Control": CACHE_CONTROL,
  "Vercel-CDN-Cache-Control": CACHE_CONTROL,
};

async function fetchSlim(params: URLSearchParams) {
  const qs = params.toString();
  const response = await fetch(qs ? `${ESPN_SCHEDULE}?${qs}` : ESPN_SCHEDULE, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return slimSchedule(await response.json());
}

/** Regular season wins the id collision; postseason games are appended. */
function mergeSeasonTypes(regular: any, postseason: any) {
  const byId = new Map<string, any>();
  for (const event of regular?.events ?? []) {
    if (event?.id) byId.set(String(event.id), event);
  }
  for (const event of postseason?.events ?? []) {
    if (event?.id && !byId.has(String(event.id))) {
      byId.set(String(event.id), event);
    }
  }
  const events = [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  return {
    team: regular?.team?.recordSummary ? regular.team : (postseason?.team ?? regular?.team),
    events,
  };
}

export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const season = incoming.get("season");
  const seasontype = incoming.get("seasontype");

  try {
    // A season with no type must include bowls and the CFP. ESPN's default
    // feed swaps to postseason-only once those games exist and drops the
    // regular-season schedule.
    if (season && !seasontype) {
      const [regular, postseason] = await Promise.all([
        fetchSlim(new URLSearchParams({ season, seasontype: "2" })),
        fetchSlim(
          new URLSearchParams({ season, seasontype: "3" }),
        ).catch(() => ({ team: { recordSummary: "" }, events: [] })),
      ]);
      return NextResponse.json(mergeSeasonTypes(regular, postseason), {
        headers: cacheHeaders,
      });
    }

    const params = new URLSearchParams();
    if (season) params.set("season", season);
    if (seasontype) params.set("seasontype", seasontype);
    const data = await fetchSlim(params);
    return NextResponse.json(data, { headers: cacheHeaders });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
