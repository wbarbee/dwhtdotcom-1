import { Game, SeasonRecord, HookEmIndex } from '../types';
import { getOpponentRank, getTexasRank } from './rankUtils';

const IN_PROGRESS_STATUSES: Game['status'][] = [
	'STATUS_IN_PROGRESS',
	'STATUS_HALFTIME',
	'STATUS_CURRENT',
	'STATUS_END_PERIOD',
	'STATUS_PRE_END_PERIOD',
	'STATUS_OVERTIME',
];

/**
 * Texas' current rank.
 *
 * `currentGame` is the same object the hero score card renders, so when one is
 * supplied both the record bar and the card badge always show the same number.
 * Without it, fall back to the newest game that actually carries a rank —
 * including a game in progress, whose poll position is fresher than the last
 * completed game's.
 */
export function resolveTexasRank(
	games: Game[],
	currentGame?: Game | null
): number | null {
	const fromCurrent = getTexasRank(currentGame);
	if (fromCurrent !== null) return fromCurrent;

	const ranked = games
		.filter(
			(g) =>
				g.status === 'STATUS_FINAL' || IN_PROGRESS_STATUSES.includes(g.status)
		)
		.sort((a, b) => b.timestamp - a.timestamp);

	for (const game of ranked) {
		const rank = getTexasRank(game);
		if (rank !== null) return rank;
	}

	return null;
}

export function parseSeasonRecord(
	games: Game[],
	currentGame?: Game | null
): SeasonRecord {
	const completedGames = games.filter((g) => g.status === 'STATUS_FINAL');
	const wins = completedGames.filter((g) => g.result === 'win').length;
	const losses = completedGames.filter((g) => g.result === 'loss').length;

	const conferenceGames = completedGames.filter((g) => g.isConferenceGame);
	const conferenceWins = conferenceGames.filter(
		(g) => g.result === 'win'
	).length;
	const conferenceLosses = conferenceGames.filter(
		(g) => g.result === 'loss'
	).length;

	// Calculate streak from most recent games
	let streak = 0;
	let streakType: 'W' | 'L' | 'none' = 'none';
	const sorted = [...completedGames].sort(
		(a, b) => b.timestamp - a.timestamp
	);
	if (sorted.length > 0) {
		streakType = sorted[0].result === 'win' ? 'W' : 'L';
		for (const game of sorted) {
			if (
				(streakType === 'W' && game.result === 'win') ||
				(streakType === 'L' && game.result === 'loss')
			) {
				streak++;
			} else {
				break;
			}
		}
	}

	const texasRank = resolveTexasRank(games, currentGame);

	return {
		wins,
		losses,
		conferenceWins,
		conferenceLosses,
		streak,
		streakType,
		texasRank,
	};
}

export function getRivalryGames(games: Game[]): Game[] {
	return games.filter((g) => g.isRivalry);
}

export function calculateHookEmIndex(games: Game[]): HookEmIndex {
	const completed = games.filter((g) => g.status === 'STATUS_FINAL');
	if (completed.length === 0) {
		return {
			score: 0,
			grade: 'N/A',
			factors: {
				winPercentage: 0,
				strengthOfVictory: 0,
				rivalryBonus: 0,
				marginFactor: 0,
				rankingBonus: 0,
			},
		};
	}

	const wins = completed.filter((g) => g.result === 'win');
	const totalGames = completed.length;

	// Factor 1: Win percentage (0-40 points)
	const winPct = wins.length / totalGames;
	const winPercentage = winPct * 40;

	// Factor 2: Strength of victory (0-20 points)
	// Higher when beating ranked opponents
	const rankedWins = wins.filter((g) => {
		const oppRank = getOpponentRank(g);
		return oppRank !== null && oppRank <= 25;
	});
	// 7 points per ranked win, capped at 20 (3 ranked wins nearly maxes it)
	const strengthOfVictory = Math.min(rankedWins.length * 7, 20);

	// Factor 3: Rivalry bonus (0-10 points)
	const rivalryGames = completed.filter((g) => g.isRivalry);
	const rivalryWins = rivalryGames.filter((g) => g.result === 'win');
	const rivalryBonus =
		rivalryGames.length > 0
			? (rivalryWins.length / rivalryGames.length) * 10
			: 5; // Default 5 if no rivalry games played yet

	// Factor 4: Margin factor (0-15 points)
	// Average point differential of wins, capped
	const avgMargin =
		wins.length > 0
			? wins.reduce((sum, g) => sum + (g.pointDifferential ?? 0), 0) /
				wins.length
			: 0;
	const marginFactor = Math.min((avgMargin / 17) * 15, 15); // 17+ pt avg (~2.5 score game) = max

	// Factor 5: Ranking bonus (0-15 points)
	// Based on the same Texas ranking the record bar and score card display
	const texasRank = resolveTexasRank(completed);
	const rankingBonus =
		texasRank === null
			? 0
			: texasRank <= 1
				? 15
				: Math.max(0, 15 - texasRank * 0.25);

	const totalScore = Math.round(
		winPercentage +
			strengthOfVictory +
			rivalryBonus +
			marginFactor +
			rankingBonus
	);
	const score = Math.min(totalScore, 100);

	return {
		score,
		grade: getHookEmGrade(score),
		factors: {
			winPercentage: Math.round(winPercentage),
			strengthOfVictory: Math.round(strengthOfVictory),
			rivalryBonus: Math.round(rivalryBonus),
			marginFactor: Math.round(marginFactor),
			rankingBonus: Math.round(rankingBonus),
		},
	};
}

export function getHookEmGrade(score: number): string {
	if (score >= 97) return 'A+';
	if (score >= 93) return 'A';
	if (score >= 90) return 'A-';
	if (score >= 87) return 'B+';
	if (score >= 83) return 'B';
	if (score >= 80) return 'B-';
	if (score >= 77) return 'C+';
	if (score >= 73) return 'C';
	if (score >= 70) return 'C-';
	if (score >= 67) return 'D+';
	if (score >= 63) return 'D';
	if (score >= 60) return 'D-';
	return 'F';
}
