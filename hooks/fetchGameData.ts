import { Game } from '@/types';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2023-08-01&endDate=2024-01-31';

const IS_DEV_MODE = process.env.NODE_ENV === 'development';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

let currentMockGameData: Game | null = null;

const createBaseGame = (): Game => ({
	id: 'mock-game',
	home: 'Texas Longhorns',
	away: 'Oklahoma Sooners',
	longhornsRecord: '6-0',
	homeTeamRank: 1,
	awayTeamRank: 11,
	currentPeriod: 3,
	homeTeamAbbrev: 'TEX',
	awayTeamAbbrev: 'OKLA',
	homeTeamScore: 21,
	awayTeamScore: 28,
	location: 'Cotton Bowl',
	neutralSite: true,
	date: new Date().toLocaleDateString(),
	timestamp: Date.now(),
	score: '21 - 28',
	result: 'loss',
	status: 'STATUS_CURRENT',
	isTexasHome: true,
});

const generateMockGameData = (overrideMode?: string): Game => {
	if (!currentMockGameData || overrideMode !== undefined) {
		const baseGame = createBaseGame();

		switch (overrideMode) {
			case 'win':
				currentMockGameData = {
					...baseGame,
					score: '28 - 21',
					result: 'win',
					homeTeamScore: 28,
					awayTeamScore: 21,
					status: 'STATUS_FINAL',
				};
				break;
			case 'loss':
				currentMockGameData = {
					...baseGame,
					result: 'loss',
					status: 'STATUS_FINAL',
				};
				break;
			case 'upcoming':
				currentMockGameData = {
					...baseGame,
					result: 'upcoming',
					status: 'STATUS_SCHEDULED',
					homeTeamScore: null,
					awayTeamScore: null,
					score: '',
					currentPeriod: null,
				};
				break;
			case 'current':
				currentMockGameData = {
					...baseGame,
					result: 'upcoming',
					status: 'STATUS_CURRENT',
				};
				break;
			default:
				currentMockGameData = baseGame;
		}
	}

	return currentMockGameData;
};

const fetchData = async (): Promise<Game[]> => {
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

		const getScore = (team: any) =>
			team.score && typeof team.score.value === 'number'
				? team.score.value
				: null;

		const isNeutralSite = event.competitions[0].neutralSite;
		const isTexasHome = texasTeam.homeAway === 'home';
		const gameStatus = event.competitions[0].status?.type?.name || 'Unknown';

		const texasScore = getScore(texasTeam);
		const opponentScore = getScore(isTexasHome ? awayTeam : homeTeam);

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
			status: gameStatus,
			isTexasHome: isTexasHome,
		};
	});
};

export const fetchGameData = async (overrideMode?: string): Promise<Game[]> => {
	if (
		IS_DEV_MODE &&
		USE_MOCK_DATA &&
		overrideMode !== undefined &&
		overrideMode !== null &&
		overrideMode !== 'auto'
	) {
		console.warn('Using mock data in dev mode with override:', overrideMode);
		return [generateMockGameData(overrideMode)];
	}
	return fetchData();
};

export const refetchGameData = async (
	overrideMode?: string
): Promise<Game[]> => {
	if (
		IS_DEV_MODE &&
		USE_MOCK_DATA &&
		overrideMode !== undefined &&
		overrideMode !== null &&
		overrideMode !== 'auto'
	) {
		console.warn(
			'Refetching mock data in dev mode with override:',
			overrideMode
		);
		currentMockGameData = null;
		return [generateMockGameData(overrideMode)];
	}
	return fetchData();
};
