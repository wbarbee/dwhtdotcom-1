'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';
import { parseSeasonRecord } from '../utils/seasonUtils';

interface SeasonRecordProps {
	games: Game[];
}

export default function SeasonRecord({ games }: SeasonRecordProps) {
	const record = useMemo(() => parseSeasonRecord(games), [games]);
	const completedGames = useMemo(
		() =>
			games
				.filter((g) => g.status === 'STATUS_FINAL')
				.sort((a, b) => a.timestamp - b.timestamp),
		[games]
	);

	if (completedGames.length === 0) return null;

	return (
		<motion.div
			className='glass-card px-5 py-3 flex items-center justify-center gap-4 md:gap-6 flex-wrap'
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.2 }}
		>
			{/* Rank Badge */}
			{record.texasRank && (
				<div className='flex items-center gap-1'>
					<span className='text-xs text-foreground/40 uppercase tracking-wider'>
						#
					</span>
					<span className='text-2xl font-score font-bold text-gradient-orange'>
						{record.texasRank}
					</span>
				</div>
			)}

			{/* W-L Record */}
			<div className='flex items-center gap-2'>
				<span className='text-2xl font-score font-bold text-accent-green'>
					{record.wins}
				</span>
				<span className='text-foreground/30 text-lg'>-</span>
				<span className='text-2xl font-score font-bold text-accent-red'>
					{record.losses}
				</span>
			</div>

			{/* Conference Record */}
			{(record.conferenceWins > 0 || record.conferenceLosses > 0) && (
				<div className='flex items-center gap-1'>
					<span className='text-xs text-foreground/40 uppercase tracking-wider mr-1'>
						SEC
					</span>
					<span className='text-sm font-score text-foreground/70'>
						{record.conferenceWins}-{record.conferenceLosses}
					</span>
				</div>
			)}

			{/* Pip Indicators */}
			<div className='flex items-center gap-1'>
				{completedGames.map((g) => (
					<span
						key={g.id}
						className={`w-2 h-2 rounded-full ${
							g.result === 'win'
								? 'bg-accent-green'
								: 'bg-accent-red'
						}`}
						title={`${g.result === 'win' ? 'W' : 'L'} vs ${g.opponentName}`}
					/>
				))}
			</div>

			{/* Streak */}
			{record.streak > 1 && record.streakType !== 'none' && (
				<div className='flex items-center gap-1'>
					<span
						className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
							record.streakType === 'W'
								? 'bg-accent-green/15 text-accent-green'
								: 'bg-accent-red/15 text-accent-red'
						}`}
					>
						{record.streakType}{record.streak}
					</span>
				</div>
			)}
		</motion.div>
	);
}
