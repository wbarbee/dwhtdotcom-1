import { useState, useEffect } from 'react';
import { Game } from '@/types';
import { fetchGameData } from './fetchGameData';

interface UseGameDataResult {
	games: Game[] | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

const useGameData = (): UseGameDataResult => {
	const [games, setGames] = useState<Game[] | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchGames = async () => {
		try {
			setIsLoading(true);
			const data = await fetchGameData();
			setGames(data);
			setError(null);
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error('An unknown error occurred')
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchGames();
	}, []);

	const refetch = () => {
		fetchGames();
	};

	return { games, isLoading, error, refetch };
};

export default useGameData;
