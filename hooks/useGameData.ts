import { useState, useEffect } from 'react';
import { Game } from '@/types';
import { fetchGameData } from './fetchGameData';

interface UseGameDataResult {
	games: Game[] | null;
	fullGameDataIsLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

const useGameData = (): UseGameDataResult => {
	const [games, setGames] = useState<Game[] | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchGames = async () => {
		try {
			const data = await fetchGameData();
			setGames(data);
			setError(null);
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error('An unknown error occurred')
			);
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 2000);
		}
	};

	useEffect(() => {
		fetchGames();
	}, []);

	const refetch = () => {
		fetchGames();
	};

	return { games, fullGameDataIsLoading: isLoading, error, refetch };
};

export default useGameData;
