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
				relevantGame =
					data.find((game) => game.status === 'STATUS_CURRENT') ||
					data.find((game) => {
						const gameDate = new Date(game.date);
						const now = new Date();
						const hoursDiff =
							(now.getTime() - gameDate.getTime()) / (1000 * 60 * 60);
						return game.status === 'STATUS_FINAL' && hoursDiff <= 48;
					}) ||
					data.find((game) => game.status === 'STATUS_SCHEDULED');
			}

			if (relevantGame) {
				setCurrentGameData(formatCurrentEventData(relevantGame));
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
