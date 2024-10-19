import { useState, useEffect } from 'react';
import { Game } from '../types';
import { fetchGameData, refetchGameData } from './fetchGameData';
import { formatCurrentEventData } from '../utils/formatCurrentEventData';

export function useCurrentGameData() {
	const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
	const [allGames, setAllGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [overrideMode, setOverrideMode] = useState<string | null>(null);

	const loadGameData = async (mode?: string) => {
		try {
			setLoading(true);
			const data =
				mode && mode !== 'auto'
					? await refetchGameData(mode)
					: await fetchGameData();
			setAllGames(data);

			console.log('Fetched games:', data);

			let relevantGame: Game | undefined;

			if (mode && mode !== 'auto' && data.length === 1) {
				relevantGame = data[0];
				console.log('Override mode, using single game:', relevantGame);
			} else {
				const now = new Date();

				// Sort games by date, most recent first
				const sortedGames = data.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);
				console.log(
					'Sorted games:',
					sortedGames.map((g) => ({ id: g.id, date: g.date, status: g.status }))
				);

				// Find the current or in-progress game
				relevantGame = sortedGames.find(
					(game) =>
						game.status === 'STATUS_CURRENT' ||
						game.status === 'STATUS_IN_PROGRESS'
				);
				console.log('Current or in-progress game:', relevantGame);

				if (!relevantGame) {
					// Find the most recently completed game (within the last 48 hours)
					relevantGame = sortedGames.find((game) => {
						const gameDate = new Date(game.date);
						const hoursDiff =
							(now.getTime() - gameDate.getTime()) / (1000 * 60 * 60);
						return game.status === 'STATUS_FINAL' && hoursDiff <= 48;
					});
					console.log('Recently completed game:', relevantGame);
				}

				if (!relevantGame) {
					// Find the next upcoming game
					relevantGame = sortedGames.find((game) => {
						const gameDate = new Date(game.date);
						return game.status === 'STATUS_SCHEDULED' && gameDate > now;
					});
					console.log('Next upcoming game:', relevantGame);
				}

				if (!relevantGame) {
					// If none of the above, use the most recent game
					relevantGame = sortedGames[0];
					console.log('Fallback to most recent game:', relevantGame);
				}
			}

			if (relevantGame) {
				console.log('Setting current game data:', relevantGame);
				setCurrentGameData(formatCurrentEventData(relevantGame));
			} else {
				console.log('No relevant game found');
			}
		} catch (err) {
			setError('Failed to fetch game data');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadGameData();
	}, []);

	const handleOverrideChange = async (mode: string | null) => {
		setOverrideMode(mode);
		await loadGameData(mode || undefined);
	};

	return {
		currentGameData,
		allGames,
		loading,
		error,
		overrideMode,
		setCurrentGameData,
		handleOverrideChange,
	};
}
