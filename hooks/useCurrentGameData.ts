import { useState, useEffect, useCallback, useRef } from 'react';
import { Game } from '../types';
import { fetchGameData, fetchLiveGame } from './fetchGameData';

const MS_PER_HOUR = 1000 * 60 * 60;
const RECENT_FINAL_WINDOW_MS = 48 * MS_PER_HOUR;
/** Kickoff → final is roughly 3.5h; used so the 48h window starts at conclusion. */
const APPROX_GAME_DURATION_MS = 3.5 * MS_PER_HOUR;

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

const getApproxEndTime = (game: Game) => game.timestamp + APPROX_GAME_DURATION_MS;

/** True for the 48 hours after a final is estimated to have ended. */
const isRecentlyConcluded = (game: Game) => {
	if (game.status !== 'STATUS_FINAL') return false;
	return Date.now() - getApproxEndTime(game) <= RECENT_FINAL_WINDOW_MS;
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

const getMostRecentFinal = (games: Game[]) =>
	games
		.filter((game) => game.status === 'STATUS_FINAL')
		.sort((a, b) => b.timestamp - a.timestamp)[0];

/**
 * Pick which game the hero card should show.
 * Upcoming is gated: never show the next scheduled game until 48h after
 * the previous final has concluded.
 */
export function selectRelevantGame(data: Game[], now = new Date()): Game | null {
	if (data.length === 0) return null;

	const inProgress = data.find((game) => isGameInProgress(game.status));
	if (inProgress) return inProgress;

	const todayScheduled = data.find(
		(game) => game.status === 'STATUS_SCHEDULED' && isGameday(game.timestamp)
	);
	if (todayScheduled) return todayScheduled;

	const mostRecentFinal = getMostRecentFinal(data);
	if (mostRecentFinal && isRecentlyConcluded(mostRecentFinal)) {
		return mostRecentFinal;
	}

	const nextUpcoming = data
		.filter((game) => {
			const gameDate = new Date(game.timestamp);
			return game.status === 'STATUS_SCHEDULED' && gameDate > now;
		})
		.sort((a, b) => a.timestamp - b.timestamp)[0];
	if (nextUpcoming) return nextUpcoming;

	return mostRecentFinal || null;
}

export function useCurrentGameData(initialOverrideMode?: string) {
	const [currentGameData, setCurrentGameData] = useState<Game | null>(null);
	const [allGames, setAllGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [overrideMode, setOverrideMode] = useState<string | undefined>(
		initialOverrideMode
	);
	const requestIdRef = useRef(0);
	const hasLoadedRef = useRef(false);
	const overrideModeRef = useRef(overrideMode);
	overrideModeRef.current = overrideMode;

	const loadGameData = useCallback(async (modeOverride?: string) => {
		const requestId = ++requestIdRef.current;
		const activeMode =
			modeOverride !== undefined ? modeOverride : overrideModeRef.current;
		const isInitialLoad = !hasLoadedRef.current;

		try {
			if (isInitialLoad) setLoading(true);
			setError(null);
			const data = await fetchGameData(activeMode);
			// Ignore out-of-order responses from overlapping refreshes
			if (requestId !== requestIdRef.current) return;

			setAllGames(data);

			if (activeMode) {
				setCurrentGameData(data[0] || null);
			} else {
				let relevantGame = selectRelevantGame(data);

				// Live summary is fresher than the schedule CDN for in-progress
				// and just-finished games (avoids needing a second refresh).
				if (
					relevantGame &&
					(isGameInProgress(relevantGame.status) ||
						isRecentlyConcluded(relevantGame))
				) {
					const liveData = await fetchLiveGame(relevantGame.id, relevantGame);
					if (requestId !== requestIdRef.current) return;
					if (liveData) {
						relevantGame = liveData;
					}
				}

				setCurrentGameData(relevantGame);
			}
			hasLoadedRef.current = true;
		} catch (err) {
			if (requestId !== requestIdRef.current) return;
			console.error('Failed to fetch game data:', err);
			setError('Failed to fetch game data');
		} finally {
			if (requestId === requestIdRef.current) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		loadGameData();
	}, [loadGameData, overrideMode]);

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
			if (newOverrideMode !== undefined) {
				setOverrideMode(newOverrideMode);
				await loadGameData(newOverrideMode);
			} else {
				await loadGameData();
			}
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
