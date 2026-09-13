import { Game, SeasonRecord, HookEmIndex, HookEmFactorBreakdown } from '../types';

const PROVISIONAL_GAME_THRESHOLD = 4;
const QUALITY_WIN_CAP = 20;
const MARGIN_PER_GAME_CAP = 21; // ~3 TDs — stops cupcake blowouts from maxing the bar

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

function getOpponentRank(game: Game): number {
	return Number(game.isTexasHome ? game.awayTeamRank : game.homeTeamRank);
}

function getTexasRank(game: Game): number {
	return Number(game.isTexasHome ? game.homeTeamRank : game.awayTeamRank);
}

/** Points for a single ranked win. #1 ≈ 10, #25 ≈ 2. Road/neutral gets a small bump. */
export function qualityWinPointsForGame(game: Game): number {
	const rank = getOpponentRank(game);
	if (rank < 1 || rank >= 26 || game.result !== 'win') return 0;

	// Linear: #1 = 10, #25 = 2
	let points = 2 + ((25 - rank) / 24) * 8;
	if (!game.isTexasHome || game.neutralSite) {
		points *= 1.15;
	}
	return points;
}

function shortOpponentLabel(game: Game): string {
	const rank = getOpponentRank(game);
	const name = game.opponentName.replace(/\s+(Longhorns|Sooners|Aggies|Tigers|Razorbacks|Bulldogs|Gators|Wildcats|Commodores|Rams|Miners)$/i, '')
		|| game.opponentName;
	const rankLabel = rank < 26 ? `#${rank} ` : '';
	const site = game.neutralSite ? ' (N)' : game.isTexasHome ? '' : ' (A)';
	return `${rankLabel}${name}${site}`.trim();
}

export function calculateHookEmIndex(games: Game[]): HookEmIndex {
	const completed = games.filter((g) => g.status === 'STATUS_FINAL');
	const emptyBreakdowns = {
		winPercentage: [] as HookEmFactorBreakdown[],
		strengthOfVictory: [] as HookEmFactorBreakdown[],
		rivalryBonus: [] as HookEmFactorBreakdown[],
		marginFactor: [] as HookEmFactorBreakdown[],
		rankingBonus: [] as HookEmFactorBreakdown[],
	};

	if (completed.length === 0) {
		return {
			score: 0,
			grade: 'N/A',
			provisional: true,
			factors: {
				winPercentage: 0,
				strengthOfVictory: 0,
				rivalryBonus: 0,
				marginFactor: 0,
				rankingBonus: 0,
			},
			breakdowns: emptyBreakdowns,
		};
	}

	const wins = completed.filter((g) => g.result === 'win');
	const totalGames = completed.length;
	const provisional = totalGames < PROVISIONAL_GAME_THRESHOLD;

	// Factor 1: Win percentage (0-40)
	const winPct = wins.length / totalGames;
	const winPercentage = winPct * 40;
	const winBreakdown: HookEmFactorBreakdown[] = [
		{
			label: `${wins.length}–${totalGames - wins.length} record`,
			points: Math.round(winPercentage),
		},
	];

	// Factor 2: Quality wins (0-20) — weighted by opponent rank
	const qualityContributions = wins
		.map((g) => ({
			game: g,
			points: qualityWinPointsForGame(g),
		}))
		.filter((c) => c.points > 0)
		.sort((a, b) => b.points - a.points);

	const rawQuality = qualityContributions.reduce((sum, c) => sum + c.points, 0);
	const strengthOfVictory = Math.min(rawQuality, QUALITY_WIN_CAP);
	const qualityScale =
		rawQuality > QUALITY_WIN_CAP ? QUALITY_WIN_CAP / rawQuality : 1;
	const qualityBreakdown: HookEmFactorBreakdown[] = qualityContributions.map(
		(c) => ({
			label: shortOpponentLabel(c.game),
			points: Math.round(c.points * qualityScale * 10) / 10,
		})
	);
	if (qualityBreakdown.length === 0) {
		qualityBreakdown.push({ label: 'No Top-25 wins yet', points: 0 });
	}

	// Factor 3: Rivalry bonus (0-10) — earned only after a rivalry is played
	const rivalryGames = completed.filter((g) => g.isRivalry);
	const rivalryWins = rivalryGames.filter((g) => g.result === 'win');
	const rivalryBonus =
		rivalryGames.length > 0
			? (rivalryWins.length / rivalryGames.length) * 10
			: 0;
	const rivalryBreakdown: HookEmFactorBreakdown[] =
		rivalryGames.length > 0
			? rivalryGames.map((g) => ({
					label: `${g.rivalryName || shortOpponentLabel(g)} — ${
						g.result === 'win' ? 'hooked' : 'not hooked'
					}`,
					points: g.result === 'win' ? Math.round(10 / rivalryGames.length) : 0,
				}))
			: [{ label: 'No rivalry games played yet', points: 0 }];

	// Factor 4: Margin (0-15) — all games, per-game cap, losses count
	const cappedDiffs = completed.map((g) => {
		const diff = g.pointDifferential ?? 0;
		return Math.max(-MARGIN_PER_GAME_CAP, Math.min(MARGIN_PER_GAME_CAP, diff));
	});
	const avgDiff =
		cappedDiffs.reduce((sum, d) => sum + d, 0) / cappedDiffs.length;
	// Map -21..+21 → 0..15 (0 differential ≈ 7.5)
	const marginFactor = Math.max(
		0,
		Math.min(15, ((avgDiff + MARGIN_PER_GAME_CAP) / (MARGIN_PER_GAME_CAP * 2)) * 15)
	);
	const marginBreakdown: HookEmFactorBreakdown[] = [
		{
			label: `Avg margin ${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(1)} (capped ±${MARGIN_PER_GAME_CAP}/game)`,
			points: Math.round(marginFactor),
		},
		...completed
			.slice()
			.sort((a, b) => b.timestamp - a.timestamp)
			.map((g) => {
				const raw = g.pointDifferential ?? 0;
				const capped = Math.max(
					-MARGIN_PER_GAME_CAP,
					Math.min(MARGIN_PER_GAME_CAP, raw)
				);
				const sign = capped >= 0 ? '+' : '';
				return {
					label: `${shortOpponentLabel(g)} ${sign}${capped}${
						Math.abs(raw) > MARGIN_PER_GAME_CAP ? '*' : ''
					}`,
					points: 0,
				};
			}),
	];

	// Factor 5: Ranking bonus (0-15) — current Texas rank
	const sorted = [...completed].sort((a, b) => b.timestamp - a.timestamp);
	const latest = sorted[0];
	const rankNum = latest ? getTexasRank(latest) : 99;
	const rankingBonus =
		rankNum >= 50 ? 0 : rankNum <= 1 ? 15 : Math.max(0, 15 - rankNum * 0.25);
	const rankingBreakdown: HookEmFactorBreakdown[] = [
		{
			label:
				rankNum < 50
					? `Currently ranked #${rankNum}`
					: 'Currently unranked',
			points: Math.round(rankingBonus),
		},
	];

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
		provisional,
		factors: {
			winPercentage: Math.round(winPercentage),
			strengthOfVictory: Math.round(strengthOfVictory),
			rivalryBonus: Math.round(rivalryBonus),
			marginFactor: Math.round(marginFactor),
			rankingBonus: Math.round(rankingBonus),
		},
		breakdowns: {
			winPercentage: winBreakdown,
			strengthOfVictory: qualityBreakdown,
			rivalryBonus: rivalryBreakdown,
			marginFactor: marginBreakdown,
			rankingBonus: rankingBreakdown,
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
