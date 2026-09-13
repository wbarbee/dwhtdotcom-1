import { Game } from '../types';

/**
 * ESPN reports rankings through two different shapes:
 *   - the schedule endpoint uses `competitor.curatedRank.current`, where an
 *     unranked team is 99
 *   - the live summary header uses `competitor.rank`, where an unranked team
 *     is 0 (or missing entirely)
 *
 * Normalizing both into `number | null` keeps every rank badge in the app
 * reading from the same scale.
 */
export function normalizeRank(rank: unknown): number | null {
	const value = Number(rank);
	if (!Number.isFinite(value)) return null;
	if (value <= 0 || value >= 50) return null;
	return value;
}

/** Texas' rank for a single game, or null when unranked/unknown. */
export function getTexasRank(game: Game | null | undefined): number | null {
	if (!game) return null;
	return normalizeRank(game.isTexasHome ? game.homeTeamRank : game.awayTeamRank);
}

/** The opponent's rank for a single game, or null when unranked/unknown. */
export function getOpponentRank(game: Game | null | undefined): number | null {
	if (!game) return null;
	return normalizeRank(game.isTexasHome ? game.awayTeamRank : game.homeTeamRank);
}
