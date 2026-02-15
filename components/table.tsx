'use client';
import { useState, useEffect } from 'react';
import { Spinner, Chip } from '@nextui-org/react';
import { fetchGameData } from '../hooks/fetchGameData';
import { Game } from '../types';

export interface StatsTableProps {
	onLoadingChange?: (loading: boolean) => void;
}

export function StatsTable({ onLoadingChange }: StatsTableProps) {
	const [games, setGames] = useState<Game[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		if (onLoadingChange) onLoadingChange(true);
		(async () => {
			try {
				const data = await fetchGameData();
				if (!mounted) return;
				setGames(Array.isArray(data) ? data : []);
			} catch (e) {
				if (!mounted) return;
				setError('Failed to load game data');
			} finally {
				if (!mounted) return;
				setIsLoading(false);
				if (onLoadingChange) onLoadingChange(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [onLoadingChange]);

	if (error) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<p className='text-accent-red'>{error}</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<Spinner size='lg' color='default' labelColor='foreground' />
			</div>
		);
	}

	if (!games || games.length === 0) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<p className='text-foreground/60'>No games scheduled.</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-2'>
			{games.map((g) => {
				const opponent = g.isTexasHome ? g.away : g.home;
				const opponentRank = g.isTexasHome ? g.awayTeamRank : g.homeTeamRank;
				const ha = g.neutralSite ? 'N' : g.isTexasHome ? 'vs' : '@';

				return (
					<div
						key={g.id}
						className='flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 dark:bg-white/[0.03] border border-white/5 hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors'
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
								<Chip
									size='sm'
									className='bg-accent-green/15 text-accent-green border-none text-xs min-w-[28px] h-5'
								>
									W
								</Chip>
							) : g.result === 'loss' ? (
								<Chip
									size='sm'
									className='bg-accent-red/15 text-accent-red border-none text-xs min-w-[28px] h-5'
								>
									L
								</Chip>
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
	);
}
