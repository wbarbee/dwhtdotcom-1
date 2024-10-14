import { Game } from '../types';

export function formatCurrentEventData(event: Partial<Game>): Game {
	return {
		id: event.id ?? '',
		home: event.home ?? '',
		away: event.away ?? '',
		longhornsRecord: event.longhornsRecord ?? null,
		currentPeriod: event.currentPeriod ?? null,
		homeTeamRank: event.homeTeamRank ?? 'unknown',
		awayTeamRank: event.awayTeamRank ?? 'unknown',
		homeTeamAbbrev: event.homeTeamAbbrev ?? 'unknown',
		awayTeamAbbrev: event.awayTeamAbbrev ?? 'unknown',
		homeTeamScore: event.homeTeamScore ?? null,
		awayTeamScore: event.awayTeamScore ?? null,
		score: event.score ?? '',
		neutralSite: event.neutralSite ?? false,
		location: event.location ?? 'unknown',
		date: event.date ?? '',
		timestamp: event.timestamp ?? 0,
		status: event.status ?? 'STATUS_SCHEDULED',
		result: event.result ?? 'upcoming',
		isTexasHome: event.isTexasHome ?? false,
	};
}
