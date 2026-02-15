'use client';
import { useState, useEffect } from 'react';
import { Spinner } from '@nextui-org/react';
import { fetchLastSeasonData } from '../hooks/fetchGameData';
import { Game } from '../types';

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
		<div className='glass-card p-4'>
			<div className='flex flex-col gap-2'>
				{games.map((g) => {
					const opponent = g.isTexasHome ? g.away : g.home;
					const opponentRank = g.isTexasHome ? g.awayTeamRank : g.homeTeamRank;
					const ha = g.neutralSite
						? 'N'
						: g.isTexasHome
							? 'vs'
							: '@';

					return (
						<div
							key={g.id}
							className='flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 dark:bg-white/[0.03] border border-white/5'
						>
							<div className='flex items-center gap-3 min-w-0'>
								<span className='text-xs text-foreground/40 font-mono w-[75px] shrink-0'>
									{g.date}
								</span>
								<span className='text-xs text-foreground/30 w-5 text-center shrink-0'>
									{ha}
								</span>
								<span className='text-sm text-foreground/90 truncate'>
									{Number(opponentRank) < 50 && (
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
							<div className='flex items-center gap-3 shrink-0'>
								{g.score && (
									<span className='text-sm font-score text-foreground/70'>
										{g.score}
									</span>
								)}
								{g.result === 'win' ? (
									<span className='text-lg min-w-[28px] text-center' role='img' aria-label='Win'>🤘</span>
								) : g.result === 'loss' ? (
									<span className='text-lg min-w-[28px] text-center rotate-180 inline-block' role='img' aria-label='Loss'>🤘</span>
								) : (
									<span className='text-xs text-foreground/30 min-w-[28px] text-center'>
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
