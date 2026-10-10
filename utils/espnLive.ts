/**
 * The team schedule feed lags live games badly (0-0 well into the first
 * quarter). ESPN's core API serves status and each team's score as tiny JSON
 * documents, so the schedule route can overlay the truth without the
 * multi-megabyte summary payload.
 */

const CORE_EVENTS =
  "https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events";

/** Matches the client's kickoff grace: the schedule may still say scheduled. */
const LIVE_WINDOW_MS = 6 * 60 * 60 * 1000;
const CORE_TIMEOUT_MS = 3_000;
const CORE_REVALIDATE_SECONDS = 10;

async function fetchCore(url: string): Promise<any> {
  const response = await fetch(url, {
    next: { revalidate: CORE_REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(CORE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

/** Not final, and kickoff is in the past but recent. */
export function isInLiveWindow(event: any, now = Date.now()): boolean {
  const status = event?.competitions?.[0]?.status?.type?.name;
  if (status === "STATUS_FINAL") return false;
  const kickoff = new Date(event?.date).getTime();
  if (!Number.isFinite(kickoff)) return false;
  const since = now - kickoff;
  return since >= 0 && since <= LIVE_WINDOW_MS;
}

/**
 * Overlay live status and scores onto slimmed schedule events. Each overlaid
 * event gets `liveVerified: true`; a live-window event that could not be
 * verified gets `false` so the client knows its score cannot be trusted.
 */
export async function overlayLiveScores<T extends { events: any[] }>(
  data: T,
): Promise<{ data: T; hasLive: boolean }> {
  const now = Date.now();
  let hasLive = false;
  const events = await Promise.all(
    data.events.map(async (event: any) => {
      if (!isInLiveWindow(event, now)) return event;
      hasLive = true;
      const competition = event.competitions[0];
      const base = `${CORE_EVENTS}/${event.id}/competitions/${event.id}`;
      try {
        const [status, ...scores] = await Promise.all([
          fetchCore(`${base}/status`),
          ...competition.competitors.map((team: any) =>
            fetchCore(`${base}/competitors/${team.id}/score`),
          ),
        ]);
        const statusName = status?.type?.name;
        if (typeof statusName !== "string") throw new Error("no status");
        const values = scores.map((s: any) => Number(s?.value));
        if (values.some((v) => !Number.isFinite(v))) throw new Error("no score");
        return {
          ...event,
          liveVerified: true,
          competitions: [
            {
              ...competition,
              status: {
                period: status.period ?? competition.status.period,
                type: { name: statusName },
              },
              competitors: competition.competitors.map(
                (team: any, i: number) => ({
                  ...team,
                  score: String(values[i]),
                }),
              ),
            },
          ],
        };
      } catch {
        return { ...event, liveVerified: false };
      }
    }),
  );
  return { data: { ...data, events }, hasLive };
}
