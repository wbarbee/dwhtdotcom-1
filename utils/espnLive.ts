/**
 * The team schedule feed lags live games badly (0-0 well into the first
 * quarter). During a game's live window the schedule route overlays status
 * and scores from two small live feeds and keeps the freshest answer:
 *   - the core API's status and per-team score documents
 *   - the SEC scoreboard (every game involving an SEC team, Texas' included)
 * Scores never go down in football, so the higher value per team is the
 * fresher one. Nothing here is cached: a cache is exactly what lags.
 */

const CORE_EVENTS =
  "https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events";
const SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";
/** ESPN's SEC group. Its scoreboard includes non-conference opponents. */
const SEC_GROUP = "8";

/** Matches the client's kickoff grace: the schedule may still say scheduled. */
const LIVE_WINDOW_MS = 6 * 60 * 60 * 1000;
const LIVE_TIMEOUT_MS = 3_000;

type Snapshot = {
  source: string;
  statusName: string;
  period: number | null;
  /** Keyed by team id. */
  scores: Record<string, number>;
};

/**
 * ESPN's edge caches can each hold a different, older copy. A unique query
 * string skips them so every read comes from the origin.
 */
export const bustEdgeCache = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

async function fetchFresh(url: string): Promise<any> {
  const response = await fetch(bustEdgeCache(url), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

const toScore = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

async function coreSnapshot(eventId: string, teamIds: string[]): Promise<Snapshot> {
  const base = `${CORE_EVENTS}/${eventId}/competitions/${eventId}`;
  const [status, ...scores] = await Promise.all([
    fetchFresh(`${base}/status`),
    ...teamIds.map((id) => fetchFresh(`${base}/competitors/${id}/score`)),
  ]);
  const statusName = status?.type?.name;
  if (typeof statusName !== "string") throw new Error("no status");
  const result: Record<string, number> = {};
  teamIds.forEach((id, i) => {
    const value = toScore(scores[i]?.value);
    if (value === null) throw new Error("no score");
    result[id] = value;
  });
  return {
    source: "core",
    statusName,
    period: toScore(status.period),
    scores: result,
  };
}

/** ESPN files scoreboard days in US Eastern time. */
const easternDay = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}${get("month")}${get("day")}`;
};

/** One scoreboard request per day, shared by every live event on it. */
async function scoreboardDay(day: string): Promise<any[]> {
  const data = await fetchFresh(
    `${SCOREBOARD}?dates=${day}&groups=${SEC_GROUP}&limit=100`,
  );
  return Array.isArray(data?.events) ? data.events : [];
}

function scoreboardSnapshot(events: any[], eventId: string, teamIds: string[]): Snapshot {
  const event = events.find((e) => String(e?.id) === eventId);
  const competition = event?.competitions?.[0];
  const statusName = competition?.status?.type?.name ?? event?.status?.type?.name;
  if (typeof statusName !== "string") throw new Error("not on scoreboard");
  const result: Record<string, number> = {};
  for (const id of teamIds) {
    const team = (competition.competitors ?? []).find(
      (c: any) => String(c?.id ?? c?.team?.id) === id,
    );
    const value = toScore(team?.score);
    if (value === null) throw new Error("no score");
    result[id] = value;
  }
  return {
    source: "scoreboard",
    statusName,
    period: toScore(competition.status?.period ?? event?.status?.period),
    scores: result,
  };
}

/** Freshest view: highest score per team, furthest-along status. */
function combine(snapshots: Snapshot[]): Snapshot {
  const rank = (s: Snapshot) =>
    (s.statusName === "STATUS_FINAL" ? 1000 : 0) + (s.period ?? 0);
  const lead = [...snapshots].sort((a, b) => rank(b) - rank(a))[0];
  const scores: Record<string, number> = {};
  for (const s of snapshots) {
    for (const [id, value] of Object.entries(s.scores)) {
      scores[id] = Math.max(scores[id] ?? 0, value);
    }
  }
  return {
    source: snapshots.map((s) => s.source).join(","),
    statusName: lead.statusName,
    period: lead.period,
    scores,
  };
}

/**
 * Kickoff is in the past but recent. Finals inside the window are overlaid
 * too: the schedule can call a game final before its score catches up.
 */
export function isInLiveWindow(event: any, now = Date.now()): boolean {
  const kickoff = new Date(event?.date).getTime();
  if (!Number.isFinite(kickoff)) return false;
  const since = now - kickoff;
  return since >= 0 && since <= LIVE_WINDOW_MS;
}

/**
 * Overlay live status and scores onto slimmed schedule events. Each overlaid
 * event gets `liveVerified: true` and `liveSources`; a live-window event no
 * live feed could answer for gets `liveVerified: false` so the client knows
 * its score cannot be trusted.
 */
export async function overlayLiveScores<T extends { events: any[] }>(
  data: T,
): Promise<{ data: T; hasLive: boolean }> {
  const now = Date.now();
  const live = data.events.filter((event) => isInLiveWindow(event, now));
  if (live.length === 0) return { data, hasLive: false };

  const days = new Map<string, Promise<any[]>>();
  const dayFor = (iso: string) => {
    const day = easternDay(iso);
    if (!days.has(day)) days.set(day, scoreboardDay(day));
    return days.get(day)!;
  };

  const overlaid = new Map<string, any>();
  await Promise.all(
    live.map(async (event: any) => {
      const competition = event.competitions[0];
      const teamIds: string[] = competition.competitors.map((t: any) => String(t.id));
      const settled = await Promise.allSettled([
        coreSnapshot(String(event.id), teamIds),
        dayFor(event.date).then((events) =>
          scoreboardSnapshot(events, String(event.id), teamIds),
        ),
      ]);
      const snapshots = settled
        .filter((r): r is PromiseFulfilledResult<Snapshot> => r.status === "fulfilled")
        .map((r) => r.value);
      if (snapshots.length === 0) {
        overlaid.set(event.id, { ...event, liveVerified: false, liveSources: "" });
        return;
      }
      const best = combine(snapshots);
      overlaid.set(event.id, {
        ...event,
        liveVerified: true,
        liveSources: best.source,
        competitions: [
          {
            ...competition,
            status: {
              period: best.period ?? competition.status.period,
              type: { name: best.statusName },
            },
            competitors: competition.competitors.map((team: any) => {
              const score = best.scores[String(team.id)];
              const others = Object.entries(best.scores)
                .filter(([id]) => id !== String(team.id))
                .map(([, v]) => v);
              // The schedule's winner flag trails the final; derive it.
              const winner =
                best.statusName === "STATUS_FINAL" && others.length > 0
                  ? score > Math.max(...others)
                  : team.winner;
              return { ...team, score: String(score), winner };
            }),
          },
        ],
      });
    }),
  );

  const events = data.events.map((event) => overlaid.get(event.id) ?? event);
  return { data: { ...data, events }, hasLive: true };
}
