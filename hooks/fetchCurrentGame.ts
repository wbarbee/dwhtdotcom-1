import { useCallback } from 'react';
import constants from '../utils/constants';
import { FormattedGameData, ScheduledEvent } from '../types';
import { createFormattedGameDataFromEvent } from '../utils/createFormattedGameDataFromEvent';
import useGameData from './useGameData';

const endpoint = constants.apiFetchSingleGameEndpoint;

const isTexasLonghornsGame = (event: ScheduledEvent): boolean => {
	return event.competitions.some((competition) =>
		competition.competitors?.some((competitor) => {
			const teamName = competitor.team?.displayName;
			return (
				typeof teamName === 'string' && teamName.includes('Texas Longhorns')
			);
		})
	);
};

const useFetchLatestGame = (mostRecentGameData: FormattedGameData[] | null) => {
	const processData = useCallback(
		(json: any) => {
			if (!json || !Array.isArray(json.events)) {
				console.error('Invalid data structure received from API');
				return null;
			}

			const events = json.events;
			const nextChanceToHookThem = events.filter(isTexasLonghornsGame);

			if (nextChanceToHookThem.length > 0) {
				const event = nextChanceToHookThem[0];
				if (!event.competitions || event.competitions.length === 0) {
					console.error('No competitions found for the event');
					return null;
				}

				const competition = event.competitions[0];
				if (!competition.competitors || competition.competitors.length < 2) {
					console.error('Invalid competitors data');
					return null;
				}

				const competitor1 = competition.competitors[0];
				const competitor2 = competition.competitors[1];
				const gameStatus = competition.status?.type?.name || 'Unknown';
				const gameDate = new Date(competition.date);
				const seasonType = competition.status?.type?.name || 'Unknown';
				const neutralSite = competition.neutralSite || false;
				const venueCity = competition.venue?.address?.city || 'Unknown';
				const venueState = competition.venue?.address?.state || 'Unknown';
				const venueStadium = competition.venue?.fullName || 'Unknown';
				const gamePeriod = competition.status?.period || 0;
				const gameClockDisplay = competition.status?.displayClock || '';
				const gameHeadline =
					competition.notes && competition.notes.length > 0
						? competition.notes[0].headline
						: '';

				return createFormattedGameDataFromEvent(
					competitor1,
					competitor2,
					gameStatus,
					gameDate,
					seasonType,
					neutralSite,
					venueCity,
					venueState,
					venueStadium,
					gamePeriod,
					gameClockDisplay,
					gameHeadline
				);
			}

			return null;
		},
		[endpoint]
	);

	return useGameData();
};

export default useFetchLatestGame;
