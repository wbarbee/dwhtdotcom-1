import { Game, SeasonRecord, HookEmIndex } from '../types';

export function parseSeasonRecord(games: Game[]): SeasonRecord {
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

	// Find Texas rank from most recent game
	const mostRecent = sorted[0];
	let texasRank: number | null = null;
	if (mostRecent) {
		const rank = mostRecent.isTexasHome
			? mostRecent.homeTeamRank
			: mostRecent.awayTeamRank;
		texasRank = Number(rank) < 50 ? rank : null;
	}

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
		const oppRank = g.isTexasHome ? g.awayTeamRank : g.homeTeamRank;
		return Number(oppRank) < 26;
	});
	const sov = totalGames > 0 ? (rankedWins.length / totalGames) * 20 : 0;
	const strengthOfVictory = Math.min(sov * 2, 20); // Scale up, cap at 20

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
	const marginFactor = Math.min((avgMargin / 28) * 15, 15); // 28+ pt avg = max

	// Factor 5: Ranking bonus (0-15 points)
	// Based on current Texas ranking
	const sorted = [...completed].sort((a, b) => b.timestamp - a.timestamp);
	const latest = sorted[0];
	const texasRank = latest
		? latest.isTexasHome
			? latest.homeTeamRank
			: latest.awayTeamRank
		: 99;
	const rankNum = Number(texasRank);
	const rankingBonus =
		rankNum >= 50 ? 0 : rankNum <= 1 ? 15 : Math.max(0, 15 - rankNum * 0.6);

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
	if (score >= 90) return 'A+';
	if (score >= 80) return 'A';
	if (score >= 70) return 'B+';
	if (score >= 60) return 'B';
	if (score >= 50) return 'C+';
	if (score >= 40) return 'C';
	if (score >= 30) return 'D';
	return 'F';
}
