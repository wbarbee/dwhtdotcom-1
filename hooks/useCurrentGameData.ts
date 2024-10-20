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

			let relevantGame: Game | undefined;

			if (mode && mode !== 'auto' && data.length === 1) {
				relevantGame = data[0];
			} else {
				const now = new Date();

				// Sort games by date, most recent first
				const sortedGames = data.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);

				// Find the current or in-progress game
				relevantGame = sortedGames.find(
					(game) =>
						game.status === 'STATUS_CURRENT' ||
						game.status === 'STATUS_IN_PROGRESS'
				);

				if (!relevantGame) {
					// Find the next upcoming game
					relevantGame = sortedGames.find((game) => {
						const gameDate = new Date(game.date);
						return game.status === 'STATUS_SCHEDULED' && gameDate > now;
					});
				}

				if (!relevantGame) {
					// Find the most recently completed game (within the last 48 hours)
					relevantGame = sortedGames.find((game) => {
						const gameDate = new Date(game.date);
						const hoursDiff =
							(now.getTime() - gameDate.getTime()) / (1000 * 60 * 60);
						return game.status === 'STATUS_FINAL' && hoursDiff <= 48;
					});
				}

				if (!relevantGame) {
					// If none of the above, use the most recent game
					relevantGame = sortedGames[0];
				}
			}

			if (relevantGame) {
				setCurrentGameData(formatCurrentEventData(relevantGame));
			} else {
				setCurrentGameData(null);
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
