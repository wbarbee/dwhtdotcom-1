import { Game } from '@/types';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2023-08-01&endDate=2024-01-31';

export async function fetchGameData(): Promise<Game[]> {
	const response = await fetch(API_FULL_SCHEDULE);
	if (!response.ok) {
		throw new Error('Failed to fetch game data');
	}
	const data = await response.json();

	console.log(data);

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
			homeTeam: homeTeam.team.displayName,
			awayTeam: awayTeam.team.displayName,
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
