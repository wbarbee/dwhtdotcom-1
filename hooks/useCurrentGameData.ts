import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types';
import { fetchGameData, fetchLiveGame } from './fetchGameData';

const isGameInProgress = (status: string) => {
	return ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_CURRENT'].includes(
		status
	);
};

export function useCurrentGameData() {
	const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
	const [allGames, setAllGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadGameData = useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetchGameData();
			setAllGames(data);

			const now = new Date();

			// First, look for a game in progress (including halftime)
			let relevantGame = data.find((game) => isGameInProgress(game.status));

			// If no game in progress, look for the next upcoming game
			if (!relevantGame) {
				relevantGame = data.find((game) => {
					const gameDate = new Date(game.date);
					return game.status === 'STATUS_SCHEDULED' && gameDate > now;
				});
			}

			// If no upcoming game, use the most recent completed game
			if (!relevantGame && data.length > 0) {
				relevantGame = data
					.filter((game) => game.status === 'STATUS_FINAL')
					.sort(
						(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
					)[0];
			}

			if (relevantGame && isGameInProgress(relevantGame.status)) {
				const liveData = await fetchLiveGame(relevantGame.id, relevantGame);
				if (liveData) {
					relevantGame = liveData;
				}
			}

			setCurrentGameData(relevantGame || null);
		} catch (err) {
			console.error('Failed to fetch game data:', err);
			setError('Failed to fetch game data');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadGameData();
	}, [loadGameData]);

	const refreshData = useCallback(async () => {
		await loadGameData();
	}, [loadGameData]);

	return {
		currentGameData,
		allGames,
		loading,
		error,
		refreshData,
	};
}
