import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types';
import { fetchGameData, fetchLiveGame } from './fetchGameData';

const isGameInProgress = (status: string) => {
	return [
		'STATUS_IN_PROGRESS',
		'STATUS_HALFTIME',
		'STATUS_CURRENT',
		'STATUS_END_PERIOD',
		'STATUS_PRE_END_PERIOD',
		'STATUS_FIRST_QUARTER',
		'STATUS_SECOND_QUARTER',
		'STATUS_THIRD_QUARTER',
		'STATUS_FOURTH_QUARTER',
		'STATUS_OVERTIME',
	].includes(status);
};

const isWithin48Hours = (gameTimestamp: number) => {
	const now = Date.now();
	const hoursDiff = (now - gameTimestamp) / (1000 * 60 * 60);
	return hoursDiff <= 48;
};

const isGameday = (gameTimestamp: number) => {
	const now = new Date();
	const gameDateObj = new Date(gameTimestamp);
	return (
		gameDateObj.getDate() === now.getDate() &&
		gameDateObj.getMonth() === now.getMonth() &&
		gameDateObj.getFullYear() === now.getFullYear()
	);
};

export function useCurrentGameData(initialOverrideMode?: string) {
	const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
	const [allGames, setAllGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [overrideMode, setOverrideMode] = useState<string | undefined>(
		initialOverrideMode
	);

	const loadGameData = useCallback(async () => {
		try {
			setLoading(true);
			setCurrentGameData(null); // Clear current data to prevent flashing
			const data = await fetchGameData(overrideMode);
			setAllGames(data);

			if (overrideMode) {
				setCurrentGameData(data[0] || null);
			} else {
				const now = new Date();

				// First, look for a game in progress
				let relevantGame = data.find((game) => isGameInProgress(game.status));

				// If no game in progress, look for a scheduled game today
				if (!relevantGame) {
					relevantGame = data.find(
						(game) =>
							game.status === 'STATUS_SCHEDULED' && isGameday(game.timestamp)
					);
				}

				// If no game today, look for a recently completed game within 48 hours
				if (!relevantGame) {
					relevantGame = data.find(
						(game) =>
							game.status === 'STATUS_FINAL' &&
							isWithin48Hours(game.timestamp) &&
							['win', 'loss'].includes(game.result)
					);
				}

				// If no recent completed game, look for the next upcoming game
				if (!relevantGame) {
					relevantGame = data.find((game) => {
						const gameDate = new Date(game.timestamp);
						return game.status === 'STATUS_SCHEDULED' && gameDate > now;
					});
				}

				// If no upcoming game, use the most recent completed game
				if (!relevantGame && data.length > 0) {
					relevantGame = data
						.filter((game) => game.status === 'STATUS_FINAL')
						.sort((a, b) => b.timestamp - a.timestamp)[0];
				}

				if (
					relevantGame &&
					isGameInProgress(relevantGame.status) &&
					!overrideMode
				) {
					const liveData = await fetchLiveGame(relevantGame.id, relevantGame);
					if (liveData) {
						relevantGame = liveData;
					}
				}

				setCurrentGameData(relevantGame || null);
			}
		} catch (err) {
			console.error('Failed to fetch game data:', err);
			setError('Failed to fetch game data');
		} finally {
			setLoading(false);
		}
	}, [overrideMode]);

	useEffect(() => {
		loadGameData();
	}, [loadGameData]);

	useEffect(() => {
		const handleVisibility = () => {
			if (document.visibilityState === 'visible') {
				loadGameData();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);
		return () =>
			document.removeEventListener('visibilitychange', handleVisibility);
	}, [loadGameData]);

	useEffect(() => {
		if (!currentGameData) return;
		const shouldPoll =
			isGameInProgress(currentGameData.status) ||
			(currentGameData.status === 'STATUS_SCHEDULED' &&
				isGameday(currentGameData.timestamp));
		if (!shouldPoll) return;
		const id = setInterval(() => {
			loadGameData();
		}, 60000);
		return () => clearInterval(id);
	}, [currentGameData, loadGameData]);

	const refreshData = useCallback(
		async (newOverrideMode?: string) => {
			setOverrideMode(newOverrideMode);
			await loadGameData();
		},
		[loadGameData]
	);

	return {
		currentGameData,
		allGames,
		loading,
		error,
		refreshData,
		overrideMode,
	};
}
