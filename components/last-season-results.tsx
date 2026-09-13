'use client';
import { useState, useEffect } from 'react';
import { Spinner } from '@nextui-org/react';
import { fetchLastSeasonData } from '../hooks/fetchGameData';
import { Game } from '../types';
import { getOpponentRank } from '../utils/rankUtils';

export default function LastSeasonResults() {
	const [games, setGames] = useState<Game[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const data = await fetchLastSeasonData();
				if (!mounted) return;
				setGames(data);
			} catch {
				if (!mounted) return;
				setError('Failed to load last season data');
			} finally {
				if (mounted) setIsLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	if (error) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
				<p className='text-accent-red text-sm'>{error}</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
				<Spinner size='lg' color='default' labelColor='foreground' />
			</div>
		);
	}

	if (games.length === 0) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
				<p className='text-foreground/40 text-sm'>No games found.</p>
			</div>
		);
	}

	return (
		<div className='glass-card p-2 sm:p-4 cursor-default'>
			<div className='flex flex-col'>
				{games.map((g) => {
					const opponent = g.isTexasHome ? g.away : g.home;
					const opponentRank = getOpponentRank(g);
					const ha = g.neutralSite
						? 'N'
						: g.isTexasHome
							? 'vs'
							: '@';
					// Strip year — it's already in the tab header
					const shortDate = g.date?.replace(/\/\d{4}$/, '') ?? g.date;

					return (
						<div
							key={g.id}
							className='flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 cursor-default'
						>
							<div className='flex items-center gap-2 sm:gap-3 min-w-0'>
								<span className='text-[11px] sm:text-xs text-foreground/40 font-mono shrink-0'>
									<span className='sm:hidden'>{shortDate}</span>
									<span className='hidden sm:inline'>{g.date}</span>
								</span>
								<span className='text-xs text-foreground/30 w-4 sm:w-5 text-center shrink-0'>
									{ha}
								</span>
								<span className='text-xs sm:text-sm text-foreground/90 truncate'>
									{opponentRank !== null && (
										<span className='text-burntOrange text-xs font-bold mr-1'>
											#{opponentRank}
										</span>
									)}
									{opponent}
								</span>
								{g.neutralSite && (
									<span className='text-[10px] text-accent-gold'>*</span>
								)}
							</div>
							<div className='flex items-center gap-2 sm:gap-3 shrink-0'>
								{g.score && (
									<span className='text-xs sm:text-sm font-score text-foreground/70'>
										{g.score}
									</span>
								)}
								{g.result === 'win' ? (
									<span className='text-base sm:text-lg min-w-[24px] sm:min-w-[28px] text-center' role='img' aria-label='Win'>🤘</span>
								) : g.result === 'loss' ? (
									<span className='text-base sm:text-lg min-w-[24px] sm:min-w-[28px] text-center rotate-180 inline-block' role='img' aria-label='Loss'>🤘</span>
								) : (
									<span className='text-xs text-foreground/30 min-w-[24px] sm:min-w-[28px] text-center'>
										--
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
