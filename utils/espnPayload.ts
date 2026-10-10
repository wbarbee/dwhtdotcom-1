/**
 * ESPN schedule and summary payloads are hundreds of KB (rosters, drives,
 * articles). The UI reads a small slice. Trimming here keeps phones from
 * downloading and parsing the rest.
 */

/** National TV, then national streaming, then whatever ESPN listed. */
function broadcastLabel(broadcasts: any): string {
  if (!Array.isArray(broadcasts)) return "";
  const entries = broadcasts
    .map((b) => ({
      type: String(b?.type?.shortName ?? ""),
      market: String(b?.market?.type ?? ""),
      name: String(b?.media?.shortName ?? "").trim(),
    }))
    .filter((b) => b.name);
  const prefer = (type: string) =>
    entries.find((b) => b.type === type && b.market === "National") ??
    entries.find((b) => b.type === type);
  return (prefer("TV") ?? prefer("Streaming") ?? entries[0])?.name ?? "";
}

export function slimSchedule(data: any) {
  const events = Array.isArray(data?.events) ? data.events : [];
  return {
    team: {
      recordSummary: data?.team?.recordSummary ?? "",
    },
    events: events.map((event: any) => {
      const competition = event?.competitions?.[0] ?? {};
      const competitors = Array.isArray(competition.competitors)
        ? competition.competitors
        : [];
      const seasonPhase =
        Number(event?.seasonType?.type) === 3 ? "postseason" : "regular";
      const headline = (competition.notes || []).find(
        (note: any) => note?.headline,
      )?.headline;
      return {
        id: event?.id,
        date: event?.date,
        seasonPhase,
        eventName: seasonPhase === "postseason" ? headline || "" : "",
        competitions: [
          {
            neutralSite: Boolean(competition.neutralSite),
            timeValid: competition.timeValid === true,
            broadcast: broadcastLabel(competition.broadcasts),
            venue: {
              fullName: competition.venue?.fullName ?? "",
            },
            status: {
              period: competition.status?.period ?? null,
              type: {
                name: competition.status?.type?.name ?? "Unknown",
              },
            },
            competitors: competitors.map((team: any) => {
              const logo = team?.team?.logos?.[0]?.href;
              return {
                id: team?.id || team?.team?.id || "",
                homeAway: team?.homeAway,
                winner: team?.winner,
                score: team?.score,
                curatedRank: {
                  current: team?.curatedRank?.current ?? 99,
                },
                team: {
                  id: team?.team?.id ?? "",
                  displayName: team?.team?.displayName ?? "",
                  abbreviation: team?.team?.abbreviation ?? "",
                  logos: logo ? [{ href: logo }] : [],
                },
              };
            }),
          },
        ],
      };
    }),
  };
}

/** Fields the hero card and the expanded box score actually read. */
export function slimSummary(data: any, view: string | null) {
  if (!data || typeof data !== "object") return data;
  if (view === "header") {
    return { header: data.header };
  }
  return {
    header: data.header,
    boxscore: data.boxscore ? { teams: data.boxscore.teams } : undefined,
    leaders: data.leaders,
    scoringPlays: data.scoringPlays,
  };
}
