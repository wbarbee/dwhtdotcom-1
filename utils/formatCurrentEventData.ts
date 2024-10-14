import { Game } from '../types';

export function formatCurrentEventData(event: Partial<Game>): Game {
	const [homeScore, awayScore] = event.score?.split('-').map(Number) ?? [
		undefined,
		undefined,
	];
	const isTexasHome = event.home?.includes('Texas') ?? false;

	return {
		id: event.id ?? '',
		home: event.home ?? '',
		away: event.away ?? '',
		currentPeriod: event.currentPeriod ?? null,
		homeTeamRank: event.homeTeamRank ?? 'unknown',
		homeTeam: event.homeTeam ?? '',
		awayTeam: event.awayTeam ?? '',
		awayTeamRank: event.awayTeamRank ?? 'unknown',
		homeTeamAbbrev: event.homeTeamAbbrev ?? 'unknown',
		awayTeamAbbrev: event.awayTeamAbbrev ?? 'unknown',
		homeTeamScore: homeScore ?? 'unknown',
		awayTeamScore: awayScore ?? 'unknown',
		score: event.score ?? '',
		location: event.location ?? 'unknown',
		date: event.date ?? '',
		timestamp: event.timestamp ?? 0,
		status: event.status ?? '',
		result: event.result ?? 'upcoming',
		isTexasHome: isTexasHome,
	};
}
