import { Game } from '@/types';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2023-08-01&endDate=2024-01-31';

export async function fetchGameData(): Promise<Game[]> {
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
			if (typeof team.score === 'object' && team.score !== null) {
				return team.score.displayValue || '-';
			}
			return team.score || '-';
		};

		const score = `${getScore(homeTeam)}-${getScore(awayTeam)}`;
		console.log(
			'Score:',
			score,
			'Home Score:',
			homeTeam.score,
			'Away Score:',
			awayTeam.score
		);

		return {
			id: event.id,
			home: homeTeam.team.displayName,
			away: awayTeam.team.displayName,
			score,
			location: event.competitions[0].venue.fullName,
			date: new Date(event.date).toLocaleDateString(),
			timestamp: new Date(event.date).getTime(),
			result:
				texasTeam.winner === true
					? 'win'
					: texasTeam.winner === false
						? 'loss'
						: 'upcoming',
			status: event.status?.type?.name || 'Unknown',
		};
	});
}
