import { useState, useEffect, useCallback, useRef } from "react";
import { Game } from "../types";
import { fetchGameData, fetchLiveGame } from "./fetchGameData";

const MS_PER_HOUR = 1000 * 60 * 60;
const RECENT_FINAL_WINDOW_MS = 48 * MS_PER_HOUR;
/** Kickoff → final is roughly 3.5h; used so the 48h window starts at conclusion. */
const APPROX_GAME_DURATION_MS = 3.5 * MS_PER_HOUR;
/**
 * How long after kickoff the live summary outranks the schedule. ESPN's
 * schedule feed can still read STATUS_SCHEDULED for a few minutes after a game
 * is underway; the summary flips immediately.
 */
const KICKOFF_GRACE_MS = 6 * MS_PER_HOUR;
/**
 * How long after the estimated final the summary is still worth a second
 * request. The schedule already has the score; this only covers the window
 * where that feed can lag a game that just ended.
 */
const SUMMARY_LAG_MS = 2 * MS_PER_HOUR;
const LIVE_POLL_MS = 30 * 1000;
const PREGAME_POLL_MS = 60 * 1000;
/** Foreground wakes arrive in bursts (visibilitychange + focus + pageshow). */
const WAKE_THROTTLE_MS = 5 * 1000;
/** A remembered live score stands in for an unverified one only this long. */
const LIVE_MEMORY_MS = 90 * 1000;

/**
 * Football scores never go down, so between two reads of the same game the
 * higher score per team is the fresher one. Status comes from `next`.
 */
const withHigherScores = (next: Game, prev: Game | undefined): Game => {
  if (!prev || prev.id !== next.id) return next;
  const home = Math.max(next.homeTeamScore ?? 0, prev.homeTeamScore ?? 0);
  const away = Math.max(next.awayTeamScore ?? 0, prev.awayTeamScore ?? 0);
  if (home === next.homeTeamScore && away === next.awayTeamScore) return next;
  const texasScore = next.isTexasHome ? home : away;
  const opponentScore = next.isTexasHome ? away : home;
  return {
    ...next,
    homeTeamScore: home,
    awayTeamScore: away,
    score: `${away} - ${home}`,
    texasScore,
    opponentScore,
    pointDifferential: texasScore - opponentScore,
  };
};

const isGameInProgress = (status: string) => {
  return [
    "STATUS_IN_PROGRESS",
    "STATUS_HALFTIME",
    "STATUS_CURRENT",
    "STATUS_END_PERIOD",
    "STATUS_PRE_END_PERIOD",
    "STATUS_FIRST_QUARTER",
    "STATUS_SECOND_QUARTER",
    "STATUS_THIRD_QUARTER",
    "STATUS_FOURTH_QUARTER",
    "STATUS_OVERTIME",
  ].includes(status);
};

const getApproxEndTime = (game: Game) =>
  game.timestamp + APPROX_GAME_DURATION_MS;

/**
 * A game the schedule still calls scheduled, but whose kickoff has passed.
 * Treated as possibly-live so the summary endpoint gets the deciding vote.
 */
export const hasKickedOff = (game: Game) => {
  if (game.status !== "STATUS_SCHEDULED") return false;
  const sinceKickoff = Date.now() - game.timestamp;
  return sinceKickoff >= 0 && sinceKickoff <= KICKOFF_GRACE_MS;
};

/** True for the 48 hours after a final is estimated to have ended. */
const isRecentlyConcluded = (game: Game) => {
  if (game.status !== "STATUS_FINAL") return false;
  return Date.now() - getApproxEndTime(game) <= RECENT_FINAL_WINDOW_MS;
};

const isGameday = (gameTimestamp: number) => {
  const now = new Date();
  const gameDateObj = new Date(gameTimestamp);
  return (
    gameDateObj.getDate() === now.getDate() &&
    gameDateObj.getMonth() === now.getMonth() &&
    gameDateObj.getFullYear() === now.getFullYear()
  );
};

const getMostRecentFinal = (games: Game[]) =>
  games
    .filter((game) => game.status === "STATUS_FINAL")
    .sort((a, b) => b.timestamp - a.timestamp)[0];

/**
 * Pick which game the hero card should show.
 * Upcoming is gated: never show the next scheduled game until 48h after
 * the previous final has concluded.
 */
export function selectRelevantGame(
  data: Game[],
  now = new Date(),
): Game | null {
  if (data.length === 0) return null;

  const inProgress = data.find((game) => isGameInProgress(game.status));
  if (inProgress) return inProgress;

  const todayScheduled = data.find(
    (game) => game.status === "STATUS_SCHEDULED" && isGameday(game.timestamp),
  );
  if (todayScheduled) return todayScheduled;

  const mostRecentFinal = getMostRecentFinal(data);
  if (mostRecentFinal && isRecentlyConcluded(mostRecentFinal)) {
    return mostRecentFinal;
  }

  const nextUpcoming = data
    .filter((game) => {
      const gameDate = new Date(game.timestamp);
      return game.status === "STATUS_SCHEDULED" && gameDate > now;
    })
    .sort((a, b) => a.timestamp - b.timestamp)[0];
  if (nextUpcoming) return nextUpcoming;

  return mostRecentFinal || null;
}

export function useCurrentGameData(initialOverrideMode?: string) {
  const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrideMode, setOverrideMode] = useState<string | undefined>(
    initialOverrideMode,
  );
  const requestIdRef = useRef(0);
  const lastWakeRef = useRef(Date.now());
  const hasLoadedRef = useRef(false);
  const overrideModeRef = useRef(overrideMode);
  overrideModeRef.current = overrideMode;
  // Last good summary per game. The schedule feed can sit on 0-0 for most of
  // a quarter, so it must not overwrite a live score on the next poll or when
  // the summary request fails.
  const lastLiveRef = useRef<Map<string, { game: Game; at: number }>>(
    new Map(),
  );
  const rememberLive = (game: Game) => {
    lastLiveRef.current.set(game.id, { game, at: Date.now() });
  };

  const loadGameData = useCallback(async (modeOverride?: string | null) => {
    const requestId = ++requestIdRef.current;
    const activeMode =
      modeOverride === null
        ? undefined
        : modeOverride !== undefined
          ? modeOverride
          : overrideModeRef.current;
    const isInitialLoad = !hasLoadedRef.current;

    try {
      if (isInitialLoad) setLoading(true);
      setError(null);
      const data = await fetchGameData(activeMode);
      // Ignore out-of-order responses from overlapping refreshes
      if (requestId !== requestIdRef.current) return;

      setAllGames(data);

      if (activeMode) {
        setCurrentGameData(data[0] || null);
      } else {
        const scheduled = selectRelevantGame(data);
        const remembered = scheduled
          ? lastLiveRef.current.get(scheduled.id)
          : undefined;
        let relevantGame = scheduled;
        if (scheduled && remembered && scheduled.status !== "STATUS_FINAL") {
          if (scheduled.scoreVerified === true) {
            relevantGame = withHigherScores(scheduled, remembered.game);
            rememberLive(relevantGame);
          } else if (Date.now() - remembered.at <= LIVE_MEMORY_MS) {
            // Brief stand-in while the summary fallback runs. Past that, an
            // old score is no better than the lagging one: show the spinner.
            relevantGame = remembered.game;
          }
        } else if (scheduled?.scoreVerified === true) {
          rememberLive(scheduled);
        }
        setCurrentGameData(relevantGame);
        if (relevantGame && relevantGame !== scheduled) {
          setAllGames((games) =>
            games.map((game) =>
              game.id === relevantGame.id ? relevantGame : game,
            ),
          );
        }
        // Paint from the schedule. The schedule route overlays live scores, so
        // the summary is only a fallback when that overlay could not verify.
        hasLoadedRef.current = true;
        if (requestId === requestIdRef.current) setLoading(false);

        // Judge the schedule's own copy: a remembered stand-in is verified but
        // old, and must not suppress the fallback.
        const scheduleMayLag =
          scheduled &&
          scheduled.scoreVerified !== true &&
          (isGameInProgress(scheduled.status) ||
            hasKickedOff(scheduled) ||
            (scheduled.status === "STATUS_FINAL" &&
              Date.now() - getApproxEndTime(scheduled) <= SUMMARY_LAG_MS));
        if (scheduleMayLag && scheduled) {
          const summary = await fetchLiveGame(scheduled.id, scheduled);
          if (requestId !== requestIdRef.current) return;
          if (summary) {
            const liveData = withHigherScores(
              summary,
              lastLiveRef.current.get(summary.id)?.game,
            );
            rememberLive(liveData);
            setCurrentGameData(liveData);
            setAllGames((games) =>
              games.map((game) => (game.id === liveData.id ? liveData : game)),
            );
          }
        }
      }
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to fetch game data:", err);
      setError("Failed to fetch game data");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadGameData();
  }, [loadGameData, overrideMode]);

  // Mobile browsers suspend timers while a tab is backgrounded, and iOS can
  // restore a page from the bfcache without firing visibilitychange — which
  // left the card showing pre-kickoff state until a manual reload. Refetch on
  // every way the page can come back to the foreground.
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastWakeRef.current < WAKE_THROTTLE_MS) return;
      lastWakeRef.current = now;
      loadGameData();
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) wake();
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);

    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
    };
  }, [loadGameData]);

  useEffect(() => {
    if (!currentGameData) return;
    const isLive = isGameInProgress(currentGameData.status);
    const isGamedayScheduled =
      currentGameData.status === "STATUS_SCHEDULED" &&
      isGameday(currentGameData.timestamp);
    if (!isLive && !isGamedayScheduled) return;
    // Tighten the cadence once the ball is in the air.
    const intervalMs =
      isLive || hasKickedOff(currentGameData) ? LIVE_POLL_MS : PREGAME_POLL_MS;
    const id = setInterval(() => {
      loadGameData();
    }, intervalMs);
    return () => clearInterval(id);
  }, [currentGameData, loadGameData]);

  const refreshData = useCallback(
    async (newOverrideMode?: string) => {
      if (newOverrideMode) {
        setOverrideMode(newOverrideMode);
        await loadGameData(newOverrideMode);
      } else {
        setOverrideMode(undefined);
        await loadGameData(null);
      }
    },
    [loadGameData],
  );

  return {
    currentGameData,
    allGames,
    loading,
    error,
    refreshData,
    overrideMode,
  };
}
