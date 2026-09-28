import {
  Game,
  GameSummaryLeader,
  GameSummaryScoringPlay,
  GameSummaryStats,
  GameSummaryTeamStats,
} from "../types";
import { mockFullSeason, getGameByMode } from "../utils/mockData";
import { normalizeRank } from "../utils/rankUtils";
import {
  awaitingChampionship,
  championshipKickoffFromGames,
  completedSeasonYear,
  isSeasonOfficiallyOver,
  liveFootballSeasonYear,
} from "../utils/seasonWindow";

const UNRANKED = 99;

const API_SCHEDULE_BASE = "/api/schedule";
const API_LIVE_GAME = "/api/game/";

const IS_DEV_MODE = process.env.NODE_ENV === "development";

// SEC conference team IDs
const SEC_TEAM_IDS = new Set([
  "2", // Auburn
  "8", // Alabama
  "57", // Florida
  "61", // Georgia
  "96", // Kentucky
  "97", // LSU
  "99", // Mississippi State (Miss State)
  "145", // Ole Miss
  "142", // Missouri
  "2032", // South Carolina
  "249", // Tennessee
  "245", // Texas A&M
  "238", // Vanderbilt
  "12", // Arkansas
  "201", // Oklahoma
]);

const RIVALRY_MAP: Record<string, string> = {
  "201": "Red River Rivalry", // Oklahoma
  "245": "Lone Star Showdown", // Texas A&M
};

const inflight = new Map<string, Promise<any>>();

const fetchJson = (url: string): Promise<any> => {
  const existing = inflight.get(url);
  if (existing) return existing;
  const request = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error("Failed to fetch game data");
    return response.json();
  });
  inflight.set(url, request);
  request.finally(() => {
    if (inflight.get(url) === request) inflight.delete(url);
  });
  return request;
};

const fetchLiveGameData = async (
  eventId: string,
  view?: "header",
): Promise<any> => {
  const qs = view ? `?view=${view}` : "";
  return fetchJson(`${API_LIVE_GAME}${eventId}${qs}`);
};

const fetchSchedule = async (
  season?: number,
  seasonType?: number,
): Promise<any> => {
  const params = new URLSearchParams();
  if (season) params.set("season", String(season));
  if (seasonType) params.set("seasontype", String(seasonType));
  const qs = params.toString();
  return fetchJson(qs ? `${API_SCHEDULE_BASE}?${qs}` : API_SCHEDULE_BASE);
};

const processEvents = (data: any): Game[] => {
  if (!data.events || data.events.length === 0) return [];
  return data.events.map((event: any) => {
    const homeTeam = event.competitions[0].competitors.find(
      (team: any) => team.homeAway === "home",
    );
    const awayTeam = event.competitions[0].competitors.find(
      (team: any) => team.homeAway === "away",
    );
    const texasTeam = event.competitions[0].competitors.find(
      (team: any) => team.id === "251",
    );

    const getScore = (team: any) => {
      if (team.score && team.score.value) {
        return parseInt(team.score.value, 10);
      } else if (team.score && typeof team.score === "string") {
        return parseInt(team.score, 10);
      }
      return null;
    };

    const isNeutralSite = event.competitions[0].neutralSite;
    const isTexasHome = texasTeam.homeAway === "home";
    const gameStatus = event.competitions[0].status?.type?.name || "Unknown";

    let homeScore = getScore(homeTeam);
    let awayScore = getScore(awayTeam);

    const calculateScore = (
      homeScore: number | null,
      awayScore: number | null,
    ) => {
      if (gameStatus === "STATUS_SCHEDULED") {
        return "";
      }
      return `${awayScore ?? 0} - ${homeScore ?? 0}`;
    };

    const determineResult = () => {
      if (gameStatus !== "STATUS_FINAL") return "upcoming";
      if (texasTeam.winner) return "win";
      if (texasTeam.winner === false) return "loss";
      return "upcoming";
    };

    // Determine opponent data
    const opponentTeam = isTexasHome ? awayTeam : homeTeam;
    const opponentId = opponentTeam.id || opponentTeam.team?.id || "";
    const opponentName = opponentTeam.team?.displayName || "";
    const opponentLogo = opponentTeam.team?.logos?.[0]?.href;

    // Calculate Texas-centric scores
    const texasScore = isTexasHome ? homeScore : awayScore;
    const oppScore = isTexasHome ? awayScore : homeScore;
    const pointDifferential =
      texasScore !== null && oppScore !== null ? texasScore - oppScore : null;

    // Rivalry and conference detection. Bowls and CFP games are not SEC games.
    const seasonPhase =
      event.seasonPhase === "postseason" ? "postseason" : "regular";
    const isRivalry = opponentId in RIVALRY_MAP;
    const rivalryName = RIVALRY_MAP[opponentId];
    const isConferenceGame =
      seasonPhase === "regular" && SEC_TEAM_IDS.has(opponentId);

    let game: Game = {
      id: event.id,
      home: homeTeam.team.displayName,
      away: awayTeam.team.displayName,
      longhornsRecord: data.team.recordSummary,
      homeTeamRank: homeTeam.curatedRank.current,
      awayTeamRank: awayTeam.curatedRank.current,
      currentPeriod: event.competitions[0].status.period,
      homeTeamAbbrev: homeTeam.team.abbreviation,
      awayTeamAbbrev: awayTeam.team.abbreviation,
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      location: event.competitions[0].venue.fullName,
      neutralSite: isNeutralSite,
      date: new Date(event.date).toLocaleDateString(),
      timestamp: new Date(event.date).getTime(),
      score: calculateScore(homeScore, awayScore),
      result: determineResult(),
      status: gameStatus,
      isTexasHome: isTexasHome,
      opponentId,
      opponentName,
      opponentLogo,
      texasScore,
      opponentScore: oppScore,
      pointDifferential,
      isRivalry,
      rivalryName,
      isConferenceGame,
      seasonPhase,
      eventName: event.eventName || undefined,
    };

    return game;
  }).sort((a: Game, b: Game) => a.timestamp - b.timestamp);
};

const fetchChampionshipKickoff = async (
  season: number,
): Promise<number | null> => {
  try {
    const data = await fetchJson(`/api/championship?season=${season}`);
    return typeof data?.kickoff === "number" ? data.kickoff : null;
  } catch {
    return null;
  }
};

/**
 * Regular season plus bowls/CFP for the football year still in progress.
 * Once Texas is eliminated, or the national championship is a couple of days
 * behind us, hand back next year's schedule so the page can go to the archive.
 */
const fetchDisplayedSeason = async (): Promise<Game[]> => {
  const now = new Date();
  const year = liveFootballSeasonYear(now);
  if (year === null) {
    return processEvents(await fetchSchedule(now.getFullYear()));
  }

  const games = processEvents(await fetchSchedule(year));
  const nowMs = now.getTime();
  const ownTitle = championshipKickoffFromGames(games);
  let titleKickoff = ownTitle;
  if (ownTitle === null && awaitingChampionship(games, nowMs)) {
    titleKickoff = await fetchChampionshipKickoff(year);
  }
  if (!isSeasonOfficiallyOver(games, nowMs, titleKickoff)) {
    return games;
  }

  try {
    return processEvents(await fetchSchedule(year + 1));
  } catch {
    return games;
  }
};

export const fetchGameData = async (
  overrideMode?: string,
  setIsRefreshing?: (isRefreshing: boolean) => void,
): Promise<Game[]> => {
  if (setIsRefreshing) setIsRefreshing(true);
  try {
    if (IS_DEV_MODE && overrideMode) {
      console.warn("Using mock data in dev mode with override:", overrideMode);
      const mockGame = getGameByMode(overrideMode);
      // Keep the fake season so the rest of the page doesn't flip to off-season.
      return [mockGame, ...mockFullSeason];
    }
    return fetchDisplayedSeason();
  } finally {
    if (setIsRefreshing) setIsRefreshing(false);
  }
};

export const refetchGameData = async (
  overrideMode?: string,
  setIsRefreshing?: (isRefreshing: boolean) => void,
): Promise<Game[]> => {
  return fetchGameData(overrideMode, setIsRefreshing);
};

/**
 * Same slate the hero uses: regular season and postseason together, until
 * that season is officially over.
 */
export const fetchUpcomingSchedule = async (): Promise<Game[]> => {
  return fetchDisplayedSeason();
};

/**
 * Fetch the most recent completed season's games, including bowls and the CFP.
 * Used by the Hook Them Index during off-season.
 */
export const fetchLastSeasonData = async (): Promise<Game[]> => {
  const data = await fetchSchedule(completedSeasonYear(new Date()));
  if (data.events && data.events.length > 0) {
    return processEvents(data);
  }
  return [];
};

export const fetchLiveGame = async (
  eventId: string,
  originalGame: Game,
): Promise<Game | null> => {
  // Always fetch real live/summary data for schedule-selected games.
  // Mock games are only used via the explicit dev override path, which
  // never calls this (it short-circuits on overrideMode in the hook).
  try {
    const liveData = await fetchLiveGameData(eventId, "header");

    if (
      !liveData ||
      !liveData.header ||
      !liveData.header.competitions ||
      liveData.header.competitions.length === 0
    ) {
      console.error("Invalid live game data structure");
      return null;
    }

    const competition = liveData.header.competitions[0];
    const homeTeam = competition.competitors.find(
      (team: any) => team.homeAway === "home",
    );
    const awayTeam = competition.competitors.find(
      (team: any) => team.homeAway === "away",
    );
    const texasTeam = competition.competitors.find(
      (team: any) => team.team.id === "251",
    );

    if (!homeTeam || !awayTeam || !texasTeam) {
      console.error("Unable to find required team data");
      return null;
    }

    const liveStatus = competition.status.type.name;
    // The summary is also consulted just after kickoff, when the schedule may
    // still say scheduled. If the game genuinely has not started, its 0-0
    // placeholder must not overwrite the pregame card.
    const hasStarted = liveStatus !== "STATUS_SCHEDULED";
    const homeScore = parseInt(homeTeam.score || "0", 10);
    const awayScore = parseInt(awayTeam.score || "0", 10);
    const isTexasHome = texasTeam.homeAway === "home";
    const texasScore = isTexasHome ? homeScore : awayScore;
    const oppScore = isTexasHome ? awayScore : homeScore;

    const updatedGame: Game = {
      ...originalGame,
      id: liveData.header.id,
      home: homeTeam.team.displayName,
      away: awayTeam.team.displayName,
      longhornsRecord:
        texasTeam.records?.[0]?.summary || originalGame.longhornsRecord,
      // The summary header reports unranked as 0 (or omits it) while the
      // schedule uses 99, so keep the schedule value when live has no rank.
      homeTeamRank:
        normalizeRank(homeTeam.rank) ?? originalGame.homeTeamRank ?? UNRANKED,
      awayTeamRank:
        normalizeRank(awayTeam.rank) ?? originalGame.awayTeamRank ?? UNRANKED,
      currentPeriod: competition.status.period,
      homeTeamAbbrev: homeTeam.team.abbreviation,
      awayTeamAbbrev: awayTeam.team.abbreviation,
      homeTeamScore: hasStarted ? homeScore : originalGame.homeTeamScore,
      awayTeamScore: hasStarted ? awayScore : originalGame.awayTeamScore,
      neutralSite: competition.neutralSite || originalGame.neutralSite,
      date: new Date(competition.date).toLocaleDateString(),
      timestamp: new Date(competition.date).getTime(),
      score: hasStarted ? `${awayScore} - ${homeScore}` : originalGame.score,
      result: texasTeam.winner
        ? "win"
        : texasTeam.winner === false
          ? "loss"
          : "upcoming",
      status: liveStatus,
      isTexasHome,
      texasScore: hasStarted ? texasScore : originalGame.texasScore,
      opponentScore: hasStarted ? oppScore : originalGame.opponentScore,
      pointDifferential: hasStarted
        ? texasScore - oppScore
        : originalGame.pointDifferential,
    };

    return updatedGame;
  } catch (error) {
    console.error("Error fetching live game data:", error);
    return null;
  }
};

/**
 * Fetch and normalize the ESPN summary payload for a completed game.
 * Returns just the fields the expanded schedule row cares about:
 *   - Per-team box-score highlights (yards, turnovers, possession, 3rd down)
 *   - Texas leader lines (passing / rushing / receiving)
 *   - Scoring plays for the drive-log view
 */
const KEY_STAT_NAMES = new Set([
  "totalYards",
  "netPassingYards",
  "rushingYards",
  "turnovers",
  "thirdDownEff",
  "possessionTime",
]);

const KEY_STAT_LABELS: Record<string, string> = {
  totalYards: "Total Yards",
  netPassingYards: "Passing",
  rushingYards: "Rushing",
  turnovers: "Turnovers",
  thirdDownEff: "3rd Down",
  possessionTime: "Possession",
};

const LEADER_CATEGORIES = new Set([
  "passingYards",
  "rushingYards",
  "receivingYards",
]);

export const fetchGameSummaryStats = async (
  eventId: string,
): Promise<GameSummaryStats | null> => {
  const data = await fetchLiveGameData(eventId);
  if (!data) return null;

  const teams: GameSummaryTeamStats[] = (data?.boxscore?.teams || []).map(
    (t: any): GameSummaryTeamStats => {
      const rawStats: any[] = t.statistics || [];
      // Preserve KEY_STAT_NAMES order for consistent side-by-side comparison
      const stats = Array.from(KEY_STAT_NAMES)
        .map((name) => {
          const found = rawStats.find((s: any) => s.name === name);
          if (!found) return null;
          return {
            label: KEY_STAT_LABELS[name] ?? found.label ?? name,
            value: String(found.displayValue ?? found.value ?? ""),
          };
        })
        .filter((s): s is { label: string; value: string } => s !== null);

      return {
        teamId: t.team?.id ?? "",
        abbreviation: t.team?.abbreviation ?? "",
        displayName: t.team?.displayName ?? t.team?.name ?? "",
        isTexas: t.team?.id === "251",
        stats,
      };
    },
  );

  const rawLeaders = data?.leaders;
  let texasLeaders: GameSummaryLeader[] = [];
  if (Array.isArray(rawLeaders)) {
    const texasBucket = rawLeaders.find((l: any) => l?.team?.id === "251");
    if (texasBucket?.leaders) {
      texasLeaders = (texasBucket.leaders as any[])
        .filter((cat: any) => LEADER_CATEGORIES.has(cat?.name))
        .map((cat: any): GameSummaryLeader | null => {
          const top = (cat.leaders || [])[0];
          if (!top) return null;
          return {
            category: cat.displayName || cat.name,
            athlete: top.athlete?.displayName || "Unknown",
            displayValue: top.displayValue || "",
          };
        })
        .filter((l): l is GameSummaryLeader => l !== null);
    }
  }

  const scoringPlays: GameSummaryScoringPlay[] = (data?.scoringPlays || []).map(
    (p: any): GameSummaryScoringPlay => ({
      id: String(p.id ?? `${p.period?.number}-${p.clock?.displayValue}`),
      period: Number(p.period?.number ?? 0),
      clock: p.clock?.displayValue ?? "",
      teamAbbrev: p.team?.abbreviation ?? "",
      text: p.text ?? "",
      awayScore: Number(p.awayScore ?? 0),
      homeScore: Number(p.homeScore ?? 0),
    }),
  );

  return {
    eventId,
    teams,
    texasLeaders,
    scoringPlays,
  };
};
