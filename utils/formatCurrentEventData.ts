import { Game } from '../types';

export const formatCurrentEventData = (event: any): Game => {
	return {
		id: event.id,
		home: event.home,
		away: event.away,
		longhornsRecord: event.longhornsRecord,
		homeTeamRank: event.homeTeamRank,
		awayTeamRank: event.awayTeamRank,
		currentPeriod:
			event.currentPeriod !== null ? Number(event.currentPeriod) : null,
		homeTeamAbbrev: event.homeTeamAbbrev,
		awayTeamAbbrev: event.awayTeamAbbrev,
		homeTeamScore:
			event.homeTeamScore !== null ? Number(event.homeTeamScore) : null,
		awayTeamScore:
			event.awayTeamScore !== null ? Number(event.awayTeamScore) : null,
		location: event.location,
		neutralSite: event.neutralSite,
		date: event.date,
		timestamp: event.timestamp,
		score: event.score,
		result: event.result,
		status: event.status,
		isTexasHome: event.isTexasHome,
		opponentId: event.opponentId || '',
		opponentName: event.opponentName || '',
		opponentLogo: event.opponentLogo,
		texasScore:
			event.texasScore !== null && event.texasScore !== undefined
				? Number(event.texasScore)
				: null,
		opponentScore:
			event.opponentScore !== null && event.opponentScore !== undefined
				? Number(event.opponentScore)
				: null,
		pointDifferential: event.pointDifferential ?? null,
		isRivalry: event.isRivalry || false,
		rivalryName: event.rivalryName,
		isConferenceGame: event.isConferenceGame,
	};
};
