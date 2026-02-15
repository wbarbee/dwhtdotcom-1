import { Game } from '../types';
import { mockGames, getGameByMode } from '../utils/mockData';

const API_SCHEDULE_BASE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule';

const API_LIVE_GAME =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=';

const IS_DEV_MODE = process.env.NODE_ENV === 'development';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// SEC conference team IDs
const SEC_TEAM_IDS = new Set([
	'2', // Auburn
	'8', // Alabama
	'57', // Florida
	'61', // Georgia
	'96', // Kentucky
	'97', // LSU
	'99', // Mississippi State (Miss State)
	'145', // Ole Miss
	'142', // Missouri
	'2032', // South Carolina
	'249', // Tennessee
	'245', // Texas A&M
	'238', // Vanderbilt
	'12', // Arkansas
	'201', // Oklahoma
]);

const RIVALRY_MAP: Record<string, string> = {
	'201': 'Red River Rivalry',
	'245': 'Lone Star Showdown',
	'2': 'Iron Skillet',
	'12': 'Southwest Classic',
	'97': 'Battle of the Bayou',
};

const fetchLiveGameData = async (eventId: string): Promise<any> => {
	const response = await fetch(`${API_LIVE_GAME}${eventId}`, {
		cache: 'no-store',
	});
	if (!response.ok) {
		throw new Error('Failed to fetch live game data');
	}
	return response.json();
};

const fetchSchedule = async (season?: number, seasonType?: number): Promise<any> => {
	const params = new URLSearchParams();
	if (season) params.set('season', String(season));
	if (seasonType) params.set('seasontype', String(seasonType));
	params.set('_', String(Date.now()));
	const url = `${API_SCHEDULE_BASE}?${params.toString()}`;
	const response = await fetch(url, { cache: 'no-store' });
	if (!response.ok) throw new Error('Failed to fetch game data');
	return response.json();
};

const processEvents = async (data: any): Promise<Game[]> => {
	if (!data.events || data.events.length === 0) return [];
	const processedGames = await Promise.all(
		data.events.map(async (event: any) => {
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
				if (team.score && team.score.value) {
					return parseInt(team.score.value, 10);
				} else if (team.score && typeof team.score === 'string') {
					return parseInt(team.score, 10);
				}
				return null;
			};

			const isNeutralSite = event.competitions[0].neutralSite;
			const isTexasHome = texasTeam.homeAway === 'home';
			const gameStatus = event.competitions[0].status?.type?.name || 'Unknown';

			let homeScore = getScore(homeTeam);
			let awayScore = getScore(awayTeam);

			const calculateScore = (
				homeScore: number | null,
				awayScore: number | null
			) => {
				if (gameStatus === 'STATUS_SCHEDULED') {
					return '';
				}
				return `${awayScore ?? 0} - ${homeScore ?? 0}`;
			};

			const determineResult = () => {
				if (gameStatus !== 'STATUS_FINAL') return 'upcoming';
				if (texasTeam.winner) return 'win';
				if (texasTeam.winner === false) return 'loss';
				return 'upcoming';
			};

			// Determine opponent data
			const opponentTeam = isTexasHome ? awayTeam : homeTeam;
			const opponentId = opponentTeam.id || opponentTeam.team?.id || '';
			const opponentName = opponentTeam.team?.displayName || '';
			const opponentLogo = opponentTeam.team?.logos?.[0]?.href;

			// Calculate Texas-centric scores
			const texasScore = isTexasHome ? homeScore : awayScore;
			const oppScore = isTexasHome ? awayScore : homeScore;
			const pointDifferential =
				texasScore !== null && oppScore !== null
					? texasScore - oppScore
					: null;

			// Rivalry and conference detection
			const isRivalry = opponentId in RIVALRY_MAP;
			const rivalryName = RIVALRY_MAP[opponentId];
			const isConferenceGame = SEC_TEAM_IDS.has(opponentId);

			let game: Game = {
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
				result: determineResult(),
				status: gameStatus,
				isTexasHome: isTexasHome,
				opponentId,
				opponentName,
				opponentLogo,
				texasScore,
				opponentScore: oppScore,
				pointDifferential,
				isRivalry,
				rivalryName,
				isConferenceGame,
			};

			// Always fetch live data for current or in-progress games
			if (
				gameStatus === 'STATUS_CURRENT' ||
				gameStatus === 'STATUS_IN_PROGRESS'
			) {
				try {
					const liveData = await fetchLiveGameData(event.id);
					if (
						liveData &&
						liveData.header &&
						liveData.header.competitions &&
						liveData.header.competitions.length > 0
					) {
						const liveCompetition = liveData.header.competitions[0];
						const liveHomeTeam = liveCompetition.competitors.find(
							(team: any) => team.homeAway === 'home'
						);
						const liveAwayTeam = liveCompetition.competitors.find(
							(team: any) => team.homeAway === 'away'
						);

						homeScore = parseInt(liveHomeTeam.score || '0', 10);
						awayScore = parseInt(liveAwayTeam.score || '0', 10);

						const liveTexasScore = isTexasHome ? homeScore : awayScore;
						const liveOppScore = isTexasHome ? awayScore : homeScore;

						game = {
							...game,
							homeTeamScore: homeScore,
							awayTeamScore: awayScore,
							score: calculateScore(homeScore, awayScore),
							currentPeriod: liveCompetition.status.period,
							status: liveCompetition.status.type.name,
							texasScore: liveTexasScore,
							opponentScore: liveOppScore,
							pointDifferential: liveTexasScore - liveOppScore,
						};
					}
				} catch (error) {
					console.error('Error fetching live game data:', error);
				}
			}

			return game;
		})
	);

	return processedGames;
};

export const fetchGameData = async (
	overrideMode?: string,
	setIsRefreshing?: (isRefreshing: boolean) => void
): Promise<Game[]> => {
	if (setIsRefreshing) setIsRefreshing(true);
	try {
		if (IS_DEV_MODE && USE_MOCK_DATA && overrideMode !== undefined) {
			console.warn('Using mock data in dev mode with override:', overrideMode);
			const mockGame = getGameByMode(overrideMode || 'scheduled');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return [mockGame];
		}
		const scheduleData = await fetchSchedule();
		const data = await processEvents(scheduleData);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return data;
	} finally {
		if (setIsRefreshing) setIsRefreshing(false);
	}
};

export const refetchGameData = async (
	overrideMode?: string,
	setIsRefreshing?: (isRefreshing: boolean) => void
): Promise<Game[]> => {
	return fetchGameData(overrideMode, setIsRefreshing);
};

/**
 * Fetch the upcoming season schedule (uses seasontype=2 to get future scheduled games).
 * Used by the schedule modal.
 */
export const fetchUpcomingSchedule = async (): Promise<Game[]> => {
	// Try default first (works during active season)
	let data = await fetchSchedule();
	if (data.events && data.events.length > 0) {
		return processEvents(data);
	}
	// During preseason, ESPN needs seasontype=2 to return the upcoming regular season
	const currentYear = new Date().getFullYear();
	const seasonYear = new Date().getMonth() < 8 ? currentYear : currentYear + 1;
	data = await fetchSchedule(seasonYear, 2);
	if (data.events && data.events.length > 0) {
		return processEvents(data);
	}
	return [];
};

/**
 * Fetch the most recent completed season's games.
 * Used by the Hook Them Index during off-season.
 */
export const fetchLastSeasonData = async (): Promise<Game[]> => {
	const currentYear = new Date().getFullYear();
	const recentSeason = new Date().getMonth() < 8 ? currentYear - 1 : currentYear;
	const data = await fetchSchedule(recentSeason);
	if (data.events && data.events.length > 0) {
		return processEvents(data);
	}
	return [];
};

export const fetchLiveGame = async (
	eventId: string,
	originalGame: Game
): Promise<Game | null> => {
	if (IS_DEV_MODE && USE_MOCK_DATA) {
		console.warn('Using mock data for live game in dev mode');
		return getGameByMode('inProgress');
	}

	try {
		const liveData = await fetchLiveGameData(eventId);

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
		const isTexasHome = texasTeam.homeAway === 'home';
		const texasScore = isTexasHome ? homeScore : awayScore;
		const oppScore = isTexasHome ? awayScore : homeScore;

		const updatedGame: Game = {
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
			isTexasHome,
			texasScore,
			opponentScore: oppScore,
			pointDifferential: texasScore - oppScore,
		};

		return updatedGame;
	} catch (error) {
		console.error('Error fetching live game data:', error);
		return null;
	}
};
