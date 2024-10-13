import { FormattedGameData } from '../types';

export interface Competitor {
	team: {
		displayName: string;
		abbreviation: string;
	};
	score: string | number | null;
	winner: boolean;
	records: Record[] | null;
	curatedRank: {
		current: number | null;
	};
}

export interface Record {
	abbreviation: string;
	description: string;
	summary: string;
	displayName: string;
	displayValue: string;
	id: string;
	shortDisplayName: string;
	type: string;
}

export const createFormattedGameDataFromEvent = (
	competitor1: Competitor | null,
	competitor2: Competitor | null,
	gameStatus: string,
	gameDate: Date,
	seasonType: string,
	neutralSite: boolean,
	venueCity: string,
	venueState: string,
	venueStadium: string,
	gamePeriod: number,
	gameClockDisplay: string,
	gameHeadline: string,
	shortName?: string
): FormattedGameData => {
	// Helper function to safely check if a team is Texas
	const isTexasTeam = (team: any) => {
		return (
			team &&
			team.team &&
			typeof team.team.displayName === 'string' &&
			team.team.displayName.includes('Texas')
		);
	};

	// Determine which team is Texas
	const texasTeam = isTexasTeam(competitor1)
		? competitor1
		: isTexasTeam(competitor2)
		? competitor2
		: null;
	const opponentTeam = texasTeam === competitor1 ? competitor2 : competitor1;

	if (!texasTeam || !opponentTeam) {
		console.error('Unable to determine Texas team or opponent');

		return {
			team1Name: 'Unknown',
			team1Score: 0,
			team1Record: 'Unknown',
			team2Record: 'Unknown',
			team1Rank: 0,
			team2Rank: 0,
			team2Name: 'Unknown',
			team2Score: 0,
			gameStatus: 'Unknown',
			gameDate: 'Unknown',
			formattedGameDate: 'Unknown',
			seasonType: 'Unknown',
			neutralSite: false,
			venueCity: 'Unknown',
			venueState: 'Unknown',
			venueStadium: 'Unknown',
			gamePeriod: 0,
			gameClockDisplay: '',
			gameHeadline: '',
			shortName: '',
			weHookedThem: undefined,
		};
	}

	const formatDate = (date: Date) => {
		const month = `${date.getMonth() + 1}`.padStart(2, '0');
		const day = `${date.getDate()}`.padStart(2, '0');
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	};

	const formatShortDate = (date: Date) => {
		const month = `${date.getMonth() + 1}`.padStart(2, '0');
		const day = `${date.getDate()}`.padStart(2, '0');
		return `${month}/${day}`;
	};

	console.log(competitor1, competitor2);

	return {
		team1Name: competitor1?.team.abbreviation || 'Texas',
		team1Record: competitor1?.records?.[0]?.summary ?? '',
		team1Rank: competitor1?.curatedRank?.current ?? 0,
		team1Score: competitor1?.score ?? '0',
		team2Name: competitor2?.team.abbreviation || 'Opponent',
		team2Record: competitor2?.records?.[0]?.summary ?? '',
		team2Rank: competitor2?.curatedRank?.current ?? 0,
		team2Score: competitor2?.score ?? '0',
		gameStatus,
		gameDate: formatDate(gameDate),
		formattedGameDate: formatShortDate(gameDate),
		seasonType,
		neutralSite,
		venueCity,
		venueState,
		venueStadium,
		gamePeriod,
		gameClockDisplay,
		gameHeadline,
		shortName,
		weHookedThem: texasTeam?.winner ?? null,
	};
};
export default createFormattedGameDataFromEvent;
