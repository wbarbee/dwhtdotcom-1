import { useState, useEffect } from 'react';
import { Game } from '../types';
import { fetchGameData } from './fetchGameData';
import { formatCurrentEventData } from '../utils/formatCurrentEventData';

export function useCurrentGameData() {
	const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadCurrentGameData() {
			try {
				setLoading(true);
				const data = await fetchGameData();
				const currentGame = data.find(
					(game) => game.status === 'STATUS_CURRENT'
				) as Game | undefined;
				if (currentGame) {
					setCurrentGameData(formatCurrentEventData(currentGame));
					return;
				}

				const recentFinalGame = data.find((game) => {
					const gameDate = new Date(game.date);
					const now = new Date();
					const hoursDiff =
						(now.getTime() - gameDate.getTime()) / (1000 * 60 * 60);
					return game.status === 'STATUS_FINAL' && hoursDiff <= 24;
				});
				if (recentFinalGame) {
					setCurrentGameData(formatCurrentEventData(recentFinalGame as Game));
					return;
				}
				const nextScheduledGame = data.find(
					(game) => game.status === 'STATUS_SCHEDULED'
				) as Game | undefined;
				if (nextScheduledGame) {
					setCurrentGameData(formatCurrentEventData(nextScheduledGame));
				}
			} catch (err) {
				setError('Failed to fetch current game data');
				console.error(err);
			} finally {
				setLoading(false);
			}
		}

		loadCurrentGameData();
	}, []);

	return { currentGameData, loading, error };
}
