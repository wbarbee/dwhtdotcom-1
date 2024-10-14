import { Game } from '@/types';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2023-08-01&endDate=2024-01-31';

const IS_DEV_MODE = process.env.NODE_ENV === 'development';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export async function fetchGameData(): Promise<Game[]> {
	if (IS_DEV_MODE && USE_MOCK_DATA) {
		console.warn('Using mock data in dev mode');
		return [generateMockGameData()];
	}

	const response = await fetch(API_FULL_SCHEDULE);
	if (!response.ok) {
		throw new Error('Failed to fetch game data');
	}
	const data = await response.json();

	return data.events.map((event: any) => {
		const homeTeam = event.competitions[0].competitors.find(
			(team: any) => team.homeAway === 'home'
		);
		const awayTeam = event.competitions[0].competitors.find(
			(team: any) => team.homeAway === 'away'
		);
		const texasTeam = event.competitions[0].competitors.find(
			(team: any) => team.id === '251'
		);

		const getScore = (team: any) => {
			if (team.score && typeof team.score.value === 'number') {
				return team.score.value;
			}
			return null;
		};

		const isNeutralSite = event.competitions[0].neutralSite;
		const isTexasHome = texasTeam.homeAway === 'home';
		const gameStatus = event.competitions[0].status?.type?.name || 'Unknown';

		const texasScore = getScore(texasTeam);
		const opponentScore = getScore(isTexasHome ? awayTeam : homeTeam);

		const formatScore = (
			homeScore: number | null,
			awayScore: number | null
		) => {
			if (gameStatus === 'STATUS_SCHEDULED') return '-';
			if (gameStatus === 'STATUS_CURRENT') return '0 - 0';
			return `${awayScore ?? '-'} - ${homeScore ?? '-'}`;
		};

		return {
			id: event.id,
			home: homeTeam.team.displayName,
			away: awayTeam.team.displayName,
			longhornsRecord: data.team.recordSummary,
			homeTeamRank: homeTeam.curatedRank.current,
			awayTeamRank: awayTeam.curatedRank.current,
			currentPeriod: event.competitions[0].status.period,
			homeTeamAbbrev: homeTeam.team.abbreviation,
			awayTeamAbbrev: awayTeam.team.abbreviation,
			homeTeamScore: getScore(homeTeam),
			awayTeamScore: getScore(awayTeam),
			location: event.competitions[0].venue.fullName,
			neutralSite: isNeutralSite,
			date: new Date(event.date).toLocaleDateString(),
			timestamp: new Date(event.date).getTime(),
			score: isNeutralSite
				? `${texasScore ?? '-'} - ${opponentScore ?? '-'}`
				: `${getScore(awayTeam) ?? '-'} - ${getScore(homeTeam) ?? '-'}`,
			result:
				texasTeam.winner === true
					? 'win'
					: texasTeam.winner === false
						? 'loss'
						: 'upcoming',
			status: event.competitions[0].status?.type?.name || 'Unknown',
			isTexasHome: isTexasHome,
		};
	});
}

function generateMockGameData(): Game {
	return {
		id: 'mock-game',
		home: 'Texas Longhorns',
		away: 'Oklahoma Sooners',
		longhornsRecord: '6-0',
		homeTeamRank: '1',
		awayTeamRank: '11',
		currentPeriod: 4,
		homeTeamAbbrev: 'TEX',
		awayTeamAbbrev: 'OKLA',
		homeTeamScore: 28,
		awayTeamScore: 21,
		location: 'DKR-Texas Memorial Stadium',
		neutralSite: false,
		date: new Date().toLocaleDateString(),
		timestamp: Date.now(),
		score: '28 - 21',
		result: 'win',
		status: 'STATUS_CURRENT',
		isTexasHome: true,
	};
}
