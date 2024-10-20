import { Game } from '../types';

const getCurrentTimestamp = () => new Date().getTime();
const get48HoursAgoTimestamp = () =>
	getCurrentTimestamp() - 48 * 60 * 60 * 1000;

const baseMockGame: Game = {
	id: '401525547',
	home: 'Texas Longhorns',
	away: 'Oklahoma Sooners',
	longhornsRecord: '5-1',
	homeTeamRank: 3,
	awayTeamRank: 12,
	currentPeriod: null,
	homeTeamAbbrev: 'TEX',
	awayTeamAbbrev: 'OKLA',
	homeTeamScore: null,
	awayTeamScore: null,
	location: 'Cotton Bowl',
	neutralSite: true,
	date: '2023-10-07',
	timestamp: getCurrentTimestamp(),
	score: '',
	result: 'upcoming',
	status: 'STATUS_SCHEDULED',
	isTexasHome: true,
};

export const mockGames: Record<string, Game> = {
	scheduled: {
		...baseMockGame,
		timestamp: getCurrentTimestamp() + 24 * 60 * 60 * 1000, // 24 hours in the future
	},
	preGame: {
		...baseMockGame,
		status: 'STATUS_PRE_GAME',
		timestamp: getCurrentTimestamp() + 30 * 60 * 1000, // 30 minutes in the future
	},
	firstQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 1,
		homeTeamScore: 7,
		awayTeamScore: 0,
		score: '0 - 7',
		timestamp: getCurrentTimestamp(),
	},
	secondQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 2,
		homeTeamScore: 14,
		awayTeamScore: 7,
		score: '7 - 14',
		timestamp: getCurrentTimestamp(),
	},
	halftime: {
		...baseMockGame,
		status: 'STATUS_HALFTIME',
		currentPeriod: 2,
		homeTeamScore: 21,
		awayTeamScore: 14,
		score: '14 - 21',
		timestamp: getCurrentTimestamp(),
	},
	thirdQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 3,
		homeTeamScore: 28,
		awayTeamScore: 21,
		score: '21 - 28',
		timestamp: getCurrentTimestamp(),
	},
	fourthQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 4,
		homeTeamScore: 35,
		awayTeamScore: 28,
		score: '28 - 35',
		timestamp: getCurrentTimestamp(),
	},
	overtime: {
		...baseMockGame,
		status: 'STATUS_OVERTIME',
		currentPeriod: 5,
		homeTeamScore: 42,
		awayTeamScore: 42,
		score: '42 - 42',
		timestamp: getCurrentTimestamp(),
	},
	finalWin: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'win',
		currentPeriod: 4,
		homeTeamScore: 42,
		awayTeamScore: 35,
		score: '35 - 42',
		timestamp: get48HoursAgoTimestamp() + 30 * 60 * 1000, // 47.5 hours ago
	},
	finalLoss: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'loss',
		currentPeriod: 4,
		homeTeamScore: 35,
		awayTeamScore: 42,
		score: '42 - 35',
		timestamp: get48HoursAgoTimestamp() + 30 * 60 * 1000, // 47.5 hours ago
	},
	oldGame: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'win',
		currentPeriod: 4,
		homeTeamScore: 49,
		awayTeamScore: 0,
		score: '0 - 49',
		timestamp: get48HoursAgoTimestamp() - 24 * 60 * 60 * 1000, // 72 hours ago
	},
};

export const getGameByMode = (mode: string): Game => {
	return mockGames[mode] || mockGames.scheduled;
};
