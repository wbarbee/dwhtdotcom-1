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
	opponentId: '201',
	opponentName: 'Oklahoma Sooners',
	opponentLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png',
	texasScore: null,
	opponentScore: null,
	pointDifferential: null,
	isRivalry: true,
	rivalryName: 'Red River Rivalry',
	isConferenceGame: true,
};

export const mockGames: Record<string, Game> = {
	scheduled: {
		...baseMockGame,
		timestamp: getCurrentTimestamp() + 24 * 60 * 60 * 1000,
	},
	preGame: {
		...baseMockGame,
		status: 'STATUS_PRE_GAME',
		timestamp: getCurrentTimestamp() + 30 * 60 * 1000,
	},
	firstQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 1,
		homeTeamScore: 7,
		awayTeamScore: 0,
		score: '0 - 7',
		texasScore: 7,
		opponentScore: 0,
		pointDifferential: 7,
		timestamp: getCurrentTimestamp(),
	},
	secondQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 2,
		homeTeamScore: 14,
		awayTeamScore: 7,
		score: '7 - 14',
		texasScore: 14,
		opponentScore: 7,
		pointDifferential: 7,
		timestamp: getCurrentTimestamp(),
	},
	halftime: {
		...baseMockGame,
		status: 'STATUS_HALFTIME',
		currentPeriod: 2,
		homeTeamScore: 21,
		awayTeamScore: 14,
		score: '14 - 21',
		texasScore: 21,
		opponentScore: 14,
		pointDifferential: 7,
		timestamp: getCurrentTimestamp(),
	},
	thirdQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 3,
		homeTeamScore: 28,
		awayTeamScore: 21,
		score: '21 - 28',
		texasScore: 28,
		opponentScore: 21,
		pointDifferential: 7,
		timestamp: getCurrentTimestamp(),
	},
	fourthQuarter: {
		...baseMockGame,
		status: 'STATUS_IN_PROGRESS',
		currentPeriod: 4,
		homeTeamScore: 35,
		awayTeamScore: 28,
		score: '28 - 35',
		texasScore: 35,
		opponentScore: 28,
		pointDifferential: 7,
		timestamp: getCurrentTimestamp(),
	},
	overtime: {
		...baseMockGame,
		status: 'STATUS_OVERTIME',
		currentPeriod: 5,
		homeTeamScore: 42,
		awayTeamScore: 42,
		score: '42 - 42',
		texasScore: 42,
		opponentScore: 42,
		pointDifferential: 0,
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
		texasScore: 42,
		opponentScore: 35,
		pointDifferential: 7,
		timestamp: get48HoursAgoTimestamp() + 30 * 60 * 1000,
	},
	finalLoss: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'loss',
		currentPeriod: 4,
		homeTeamScore: 35,
		awayTeamScore: 42,
		score: '42 - 35',
		texasScore: 35,
		opponentScore: 42,
		pointDifferential: -7,
		timestamp: get48HoursAgoTimestamp() + 30 * 60 * 1000,
	},
	oldGame: {
		...baseMockGame,
		status: 'STATUS_FINAL',
		result: 'win',
		currentPeriod: 4,
		homeTeamScore: 49,
		awayTeamScore: 0,
		score: '0 - 49',
		texasScore: 49,
		opponentScore: 0,
		pointDifferential: 49,
		timestamp: get48HoursAgoTimestamp() - 24 * 60 * 60 * 1000,
	},
};

// Mock full season for testing season record, rivalry tracker, and Hook Em Index
export const mockFullSeason: Game[] = [
	{ ...baseMockGame, id: '1', away: 'Colorado State Rams', opponentId: '36', opponentName: 'Colorado State Rams', isRivalry: false, rivalryName: undefined, isConferenceGame: false, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 52, awayTeamScore: 0, texasScore: 52, opponentScore: 0, pointDifferential: 52, score: '0 - 52', homeTeamRank: 3, awayTeamRank: 99, date: '9/6/2025', timestamp: new Date('2025-09-06').getTime() },
	{ ...baseMockGame, id: '2', away: 'UTEP Miners', opponentId: '2638', opponentName: 'UTEP Miners', isRivalry: false, rivalryName: undefined, isConferenceGame: false, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 45, awayTeamScore: 10, texasScore: 45, opponentScore: 10, pointDifferential: 35, score: '10 - 45', homeTeamRank: 3, awayTeamRank: 99, date: '9/13/2025', timestamp: new Date('2025-09-13').getTime() },
	{ ...baseMockGame, id: '3', home: 'Florida Gators', away: 'Texas Longhorns', opponentId: '57', opponentName: 'Florida Gators', isTexasHome: false, isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 17, awayTeamScore: 31, texasScore: 31, opponentScore: 17, pointDifferential: 14, score: '31 - 17', homeTeamRank: 15, awayTeamRank: 3, date: '9/20/2025', timestamp: new Date('2025-09-20').getTime() },
	{ ...baseMockGame, id: '4', away: 'Mississippi State Bulldogs', opponentId: '99', opponentName: 'Mississippi State Bulldogs', isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 38, awayTeamScore: 14, texasScore: 38, opponentScore: 14, pointDifferential: 24, score: '14 - 38', homeTeamRank: 2, awayTeamRank: 99, date: '9/27/2025', timestamp: new Date('2025-09-27').getTime() },
	{ ...baseMockGame, id: '5', status: 'STATUS_FINAL', result: 'win', homeTeamScore: 42, awayTeamScore: 35, texasScore: 42, opponentScore: 35, pointDifferential: 7, score: '35 - 42', date: '10/11/2025', timestamp: new Date('2025-10-11').getTime() },
	{ ...baseMockGame, id: '6', home: 'Georgia Bulldogs', away: 'Texas Longhorns', opponentId: '61', opponentName: 'Georgia Bulldogs', isTexasHome: false, isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'loss', homeTeamScore: 28, awayTeamScore: 21, texasScore: 21, opponentScore: 28, pointDifferential: -7, score: '21 - 28', homeTeamRank: 1, awayTeamRank: 2, date: '10/18/2025', timestamp: new Date('2025-10-18').getTime() },
	{ ...baseMockGame, id: '7', away: 'Vanderbilt Commodores', opponentId: '238', opponentName: 'Vanderbilt Commodores', isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 41, awayTeamScore: 7, texasScore: 41, opponentScore: 7, pointDifferential: 34, score: '7 - 41', homeTeamRank: 5, awayTeamRank: 99, date: '11/1/2025', timestamp: new Date('2025-11-01').getTime() },
	{ ...baseMockGame, id: '8', away: 'Arkansas Razorbacks', opponentId: '12', opponentName: 'Arkansas Razorbacks', isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 35, awayTeamScore: 17, texasScore: 35, opponentScore: 17, pointDifferential: 18, score: '17 - 35', homeTeamRank: 4, awayTeamRank: 22, date: '11/8/2025', timestamp: new Date('2025-11-08').getTime() },
	{ ...baseMockGame, id: '9', home: 'Kentucky Wildcats', away: 'Texas Longhorns', opponentId: '96', opponentName: 'Kentucky Wildcats', isTexasHome: false, isRivalry: false, rivalryName: undefined, isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 10, awayTeamScore: 34, texasScore: 34, opponentScore: 10, pointDifferential: 24, score: '34 - 10', homeTeamRank: 99, awayTeamRank: 3, date: '11/15/2025', timestamp: new Date('2025-11-15').getTime() },
	{ ...baseMockGame, id: '10', away: 'Texas A&M Aggies', opponentId: '245', opponentName: 'Texas A&M Aggies', isRivalry: true, rivalryName: 'Lone Star Showdown', isConferenceGame: true, status: 'STATUS_FINAL', result: 'win', homeTeamScore: 38, awayTeamScore: 24, texasScore: 38, opponentScore: 24, pointDifferential: 14, score: '24 - 38', homeTeamRank: 3, awayTeamRank: 10, date: '11/29/2025', timestamp: new Date('2025-11-29').getTime() },
	{ ...baseMockGame, id: '11', status: 'STATUS_SCHEDULED', result: 'upcoming', homeTeamScore: null, awayTeamScore: null, texasScore: null, opponentScore: null, pointDifferential: null, score: '', away: 'LSU Tigers', opponentId: '97', opponentName: 'LSU Tigers', isRivalry: false, rivalryName: undefined, isConferenceGame: true, homeTeamRank: 3, awayTeamRank: 8, date: '12/6/2025', timestamp: new Date('2025-12-06').getTime() },
];

const timestampForMode = (mode: string): number => {
	const now = Date.now();
	switch (mode) {
		case 'scheduled':
			return now + 24 * 60 * 60 * 1000;
		case 'preGame':
			return now + 30 * 60 * 1000;
		case 'finalWin':
		case 'finalLoss':
			return now - 48 * 60 * 60 * 1000 + 30 * 60 * 1000;
		case 'oldGame':
			return now - 72 * 60 * 60 * 1000;
		default:
			return now;
	}
};

export const getGameByMode = (mode: string): Game => {
	const game = mockGames[mode] || mockGames.scheduled;
	const timestamp = timestampForMode(mockGames[mode] ? mode : 'scheduled');
	return {
		...game,
		timestamp,
		date: new Date(timestamp).toLocaleDateString(),
	};
};
