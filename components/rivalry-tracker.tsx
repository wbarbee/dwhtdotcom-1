'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chip } from '@nextui-org/react';
import { Game } from '../types';
import { getRivalryGames } from '../utils/seasonUtils';

interface RivalryTrackerProps {
	games: Game[];
}

const RIVALRY_ACCENT: Record<string, string> = {
	'Red River Rivalry': 'border-l-red-700',
	'Lone Star Showdown': 'border-l-red-900',
	'Southwest Classic': 'border-l-red-600',
	'Iron Skillet': 'border-l-blue-800',
	'Battle of the Bayou': 'border-l-purple-700',
};

export default function RivalryTracker({ games }: RivalryTrackerProps) {
	const rivalryGames = useMemo(
		() => getRivalryGames(games).sort((a, b) => a.timestamp - b.timestamp),
		[games]
	);

	if (rivalryGames.length === 0) {
		return (
			<div className='flex items-center justify-center py-8 text-foreground/40 text-sm'>
				No rivalry games on the schedule
			</div>
		);
	}

	return (
		<motion.div
			className='flex flex-col gap-3 w-full'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			{rivalryGames.map((game, i) => {
				const accentClass =
					RIVALRY_ACCENT[game.rivalryName || ''] || 'border-l-burntOrange';
				const isCompleted = game.status === 'STATUS_FINAL';

				return (
					<motion.div
						key={game.id}
						className={`glass-card border-l-4 ${accentClass} px-4 py-4 flex items-center justify-between`}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: i * 0.1 }}
					>
						<div className='flex flex-col gap-1 min-w-0'>
							<span className='text-[10px] uppercase tracking-widest text-foreground/40 font-display'>
								{game.rivalryName}
							</span>
							<span className='text-sm font-semibold text-foreground/90 truncate'>
								{game.isTexasHome ? 'vs' : '@'}{' '}
								{game.opponentName}
							</span>
							<span className='text-xs text-foreground/40'>
								{game.date} &middot; {game.location}
							</span>
						</div>
						<div className='flex flex-col items-end gap-1 shrink-0'>
							{isCompleted ? (
								<>
									<span className='text-xl font-score font-bold text-foreground'>
										{game.texasScore} - {game.opponentScore}
									</span>
									<Chip
										size='sm'
										className={`border-none text-xs ${
											game.result === 'win'
												? 'bg-accent-green/15 text-accent-green'
												: 'bg-accent-red/15 text-accent-red'
										}`}
									>
										{game.result === 'win' ? 'HOOKED' : 'NOT HOOKED'}
									</Chip>
								</>
							) : (
								<span className='text-xs text-foreground/50 font-mono'>
									UPCOMING
								</span>
							)}
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
}
