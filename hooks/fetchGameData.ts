import { Game } from '../types';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2024-08-01&endDate=2025-03-31';

const API_LIVE_GAME =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=';

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
					status: 'STATUS_IN_PROGRESS',
				};
				break;
			default:
				currentMockGameData = baseGame;
		}
	}

	return currentMockGameData;
};

const fetchLiveGameData = async (eventId: string): Promise<any> => {
	const response = await fetch(`${API_LIVE_GAME}${eventId}`);
	if (!response.ok) {
		throw new Error('Failed to fetch live game data');
	}
	return response.json();
};

const fetchData = async (forceRefresh: boolean = false): Promise<Game[]> => {
	const url = forceRefresh
		? `${API_FULL_SCHEDULE}&_=${Date.now()}`
		: API_FULL_SCHEDULE;
	const response = await fetch(url, {
		cache: forceRefresh ? 'no-cache' : 'default',
	});

	if (!response.ok) {
		throw new Error('Failed to fetch game data');
	}
	const data = await response.json();

	console.log('Schedule data:', data);

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
			team.score && typeof team.score === 'string'
				? parseInt(team.score, 10)
				: null;

		const isNeutralSite = event.competitions[0].neutralSite;
		const isTexasHome = texasTeam.homeAway === 'home';
		const gameStatus = event.competitions[0].status?.type?.name || 'Unknown';

		const homeScore = getScore(homeTeam);
		const awayScore = getScore(awayTeam);

		const calculateScore = (
			homeScore: number | null,
			awayScore: number | null
		) => {
			if (gameStatus === 'STATUS_SCHEDULED') {
				return '';
			}
			return `${awayScore ?? 0} - ${homeScore ?? 0}`;
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
			homeTeamScore: homeScore,
			awayTeamScore: awayScore,
			location: event.competitions[0].venue.fullName,
			neutralSite: isNeutralSite,
			date: new Date(event.date).toLocaleDateString(),
			timestamp: new Date(event.date).getTime(),
			score: calculateScore(homeScore, awayScore),
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
	return fetchData(true); // Force a refresh
};

export const fetchLiveGame = async (
	eventId: string,
	originalGame: Game
): Promise<Game | null> => {
	try {
		const liveData = await fetchLiveGameData(eventId);
		console.log('Live game data:', liveData);

		if (
			!liveData ||
			!liveData.header ||
			!liveData.header.competitions ||
			liveData.header.competitions.length === 0
		) {
			console.error('Invalid live game data structure');
			return null;
		}

		const competition = liveData.header.competitions[0];
		const homeTeam = competition.competitors.find(
			(team: any) => team.homeAway === 'home'
		);
		const awayTeam = competition.competitors.find(
			(team: any) => team.homeAway === 'away'
		);
		const texasTeam = competition.competitors.find(
			(team: any) => team.team.id === '251'
		);

		if (!homeTeam || !awayTeam || !texasTeam) {
			console.error('Unable to find required team data');
			return null;
		}

		const homeScore = parseInt(homeTeam.score || '0', 10);
		const awayScore = parseInt(awayTeam.score || '0', 10);

		return {
			...originalGame,
			id: liveData.header.id,
			home: homeTeam.team.displayName,
			away: awayTeam.team.displayName,
			longhornsRecord:
				texasTeam.records?.[0]?.summary || originalGame.longhornsRecord,
			homeTeamRank: homeTeam.rank,
			awayTeamRank: awayTeam.rank,
			currentPeriod: competition.status.period,
			homeTeamAbbrev: homeTeam.team.abbreviation,
			awayTeamAbbrev: awayTeam.team.abbreviation,
			homeTeamScore: homeScore,
			awayTeamScore: awayScore,
			// Keep the original location
			// location: competition.venue?.fullName || originalGame.location,
			neutralSite: competition.neutralSite || originalGame.neutralSite,
			date: new Date(competition.date).toLocaleDateString(),
			timestamp: new Date(competition.date).getTime(),
			score: `${awayScore} - ${homeScore}`,
			result: texasTeam.winner
				? 'win'
				: texasTeam.winner === false
					? 'loss'
					: 'upcoming',
			status: competition.status.type.name,
			isTexasHome: texasTeam.homeAway === 'home',
		};
	} catch (error) {
		console.error('Error fetching live game data:', error);
		return null;
	}
};
