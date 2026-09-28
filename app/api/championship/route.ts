import { NextRequest, NextResponse } from "next/server";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";

/** The title game flips to final once. A few minutes of cache is enough. */
const REVALIDATE_SECONDS = 300;
const CACHE_CONTROL = `public, max-age=60, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600`;

/**
 * Kickoff timestamp of a completed CFP national championship for `season`,
 * or null when that game is not final yet. Used so a bowl win does not
 * archive the regular season before the championship is actually over.
 */
export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season");
  if (!season || !/^\d{4}$/.test(season)) {
    return NextResponse.json(
      { kickoff: null },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(
      `${ESPN_SCOREBOARD}?seasontype=3&dates=${season}&limit=100`,
      {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { kickoff: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const data = await response.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const title = events.find((event: any) => {
      const competition = event?.competitions?.[0];
      const notes = Array.isArray(competition?.notes) ? competition.notes : [];
      const headline = notes.map((note: any) => note?.headline ?? "").join(" ");
      const isCfpTitle = /playoff national championship/i.test(headline);
      return (
        isCfpTitle && competition?.status?.type?.name === "STATUS_FINAL"
      );
    });
    const kickoff = title ? new Date(title.date).getTime() : null;

    return NextResponse.json(
      { kickoff: Number.isFinite(kickoff) ? kickoff : null },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
          "CDN-Cache-Control": CACHE_CONTROL,
          "Vercel-CDN-Cache-Control": CACHE_CONTROL,
        },
      },
    );
  } catch {
    return NextResponse.json(
      { kickoff: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
