import { useState, useEffect } from 'react';
import { useFetchLatestGame } from './fetchCurrentGame';

interface UseCurrentGameDateResult {
	currentGameDate: string | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

const useCurrentGameDate = (): UseCurrentGameDateResult => {
	const [currentGameDate, setCurrentGameDate] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchDate = async () => {
		try {
			setIsLoading(true);
			const date = await useFetchLatestGame();
			setCurrentGameDate(date);
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
		fetchDate();
	}, []);

	const refetch = () => {
		fetchDate();
	};

	return { currentGameDate, isLoading, error, refetch };
};

export default useCurrentGameDate;
