import { Game } from '../types';

const baseMockGame: Game = {
	id: '401525547',
	home: 'Texas Longhorns',
	away: 'Oklahoma Sooners',
	longhornsRecord: '5-1',
	homeTeamRank: 3,
	awayTeamRank: 12,
	currentPeriod: 2,
	homeTeamAbbrev: 'TEX',
	awayTeamAbbrev: 'OKLA',
	homeTeamScore: 21,
	awayTeamScore: 14,
	location: 'Cotton Bowl',
	neutralSite: true,
	date: '2023-10-07',
	timestamp: 1696694400000,
	score: '14 - 21',
	result: 'upcoming',
	status: 'STATUS_SCHEDULED',
	isTexasHome: true,
};

export const mockGames: Record<string, Game> = {
	scheduled: {
		...baseMockGame,
		status: 'STATUS_SCHEDULED',
		result: 'upcoming',
		homeTeamScore: null,
		awayTeamScore: null,
		score: '',
		currentPeriod: null,
	},
	inProgress: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		result: 'upcoming',
	},
	halftime: {
		...baseMockGame,
		status: 'STATUS_HALFTIME',
		result: 'upcoming',
	},
	endOfQuarter: {
		...baseMockGame,
		status: 'STATUS_END_PERIOD',
		result: 'upcoming',
	},
	win: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'win',
		homeTeamScore: 28,
		awayTeamScore: 21,
		score: '21 - 28',
	},
	loss: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'loss',
		homeTeamScore: 21,
		awayTeamScore: 28,
		score: '28 - 21',
	},
};

export const getGameByMode = (mode: string): Game => {
	return mockGames[mode] || mockGames.scheduled;
};
