/**
 * ESPN's team schedule returns one season type at a time. During bowls and the
 * CFP the default feed is postseason only, so regular-season games have to be
 * requested separately and kept until this season is actually finished.
 */

/** Kickoff → final is roughly 3.5h. The linger starts after that. */
const GAME_DURATION_MS = 3.5 * 60 * 60 * 1000;
/** Keep the season up for a couple of days after the ending game. */
export const SEASON_LINGER_MS = 2 * 24 * 60 * 60 * 1000;

export type SeasonSnap = {
	status: string;
	result: 'win' | 'loss' | 'upcoming';
	timestamp: number;
	seasonPhase?: 'regular' | 'postseason';
	eventName?: string;
};

/** August–January: the football season still in progress. Spring/summer: null. */
export function liveFootballSeasonYear(now: Date): number | null {
	const month = now.getMonth();
	if (month === 0) return now.getFullYear() - 1;
	if (month >= 7) return now.getFullYear();
	return null;
}

/** Year whose full results (regular + postseason) belong in the archive view. */
export function completedSeasonYear(now: Date): number {
	return now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

export function isNationalChampionship(eventName?: string): boolean {
	if (!eventName) return false;
	return /playoff national championship/i.test(eventName);
}

export function championshipKickoffFromGames(
	games: SeasonSnap[],
): number | null {
	const title = games.find(
		(game) =>
			game.status === 'STATUS_FINAL' &&
			isNationalChampionship(game.eventName),
	);
	return title ? title.timestamp : null;
}

/** A postseason loss ends Texas' run. A bowl or playoff win does not. */
export function texasIsEliminated(games: SeasonSnap[]): boolean {
	const postseason = games.filter((game) => game.seasonPhase === 'postseason');
	if (postseason.length === 0) return false;
	const last = postseason.reduce((latest, game) =>
		game.timestamp > latest.timestamp ? game : latest,
	);
	return last.result === 'loss';
}

function lastKickoff(games: SeasonSnap[]): number {
	return games.reduce(
		(latest, game) => Math.max(latest, game.timestamp),
		0,
	);
}

function lingerElapsed(kickoff: number, now: number): boolean {
	return now >= kickoff + GAME_DURATION_MS + SEASON_LINGER_MS;
}

/**
 * True when every Texas game is final, the linger has passed, and either
 * Texas has been eliminated or the CFP national championship is over.
 * A missing championship kickoff keeps the season — never drop regular-season
 * games just because the bowl schedule has not been published yet.
 */
export function isSeasonOfficiallyOver(
	games: SeasonSnap[],
	now: number,
	championshipKickoff: number | null,
): boolean {
	if (games.length === 0) return false;
	if (games.some((game) => game.status !== 'STATUS_FINAL')) return false;
	if (!lingerElapsed(lastKickoff(games), now)) return false;
	if (texasIsEliminated(games)) return true;
	if (championshipKickoff === null) return false;
	return lingerElapsed(championshipKickoff, now);
}

/** Bowl win, or no bowl yet, and long enough after Texas' last game to ask about the title. */
export function awaitingChampionship(games: SeasonSnap[], now: number): boolean {
	if (games.length === 0) return false;
	if (games.some((game) => game.status !== 'STATUS_FINAL')) return false;
	if (texasIsEliminated(games)) return false;
	if (championshipKickoffFromGames(games) !== null) return false;
	return lingerElapsed(lastKickoff(games), now);
}
