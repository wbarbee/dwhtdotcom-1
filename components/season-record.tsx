'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';
import { parseSeasonRecord } from '../utils/seasonUtils';

interface SeasonRecordProps {
	games: Game[];
	/** The game the hero card is showing, so both rank badges agree. */
	currentGame?: Game | null;
}

export default function SeasonRecord({
	games,
	currentGame,
}: SeasonRecordProps) {
	const record = useMemo(
		() => parseSeasonRecord(games, currentGame),
		[games, currentGame]
	);
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
			className='glass-card px-4 py-4 flex items-start justify-center gap-4 sm:gap-6 flex-wrap'
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.2 }}
		>
			{/* Rank Badge */}
			{record.texasRank && (
				<div className='flex flex-col items-center gap-1 border-r border-foreground/15 pr-4 sm:pr-6'>
					<span className='text-[10px] text-foreground/50 uppercase tracking-widest'>
						Rank
					</span>
					<span className='text-2xl font-score font-bold text-gradient-orange'>
						#{record.texasRank}
					</span>
				</div>
			)}

			{/* Overall record and game results */}
			<div className='flex flex-col items-center gap-1'>
				<span className='text-[10px] text-foreground/50 uppercase tracking-widest'>
					Overall
				</span>
				<div className='flex items-center gap-2' aria-label={`${record.wins} wins, ${record.losses} losses`}>
					<span className='text-2xl font-score font-bold text-accent-green'>
						{record.wins}
					</span>
					<span className='text-foreground/30 text-lg'>-</span>
					<span className='text-2xl font-score font-bold text-accent-red'>
						{record.losses}
					</span>
				</div>
				<div className='flex flex-wrap justify-center gap-1 max-w-[96px] mt-1' aria-label='Game results'>
					{completedGames.map((g) => (
						<span
							key={g.id}
							className={`w-1.5 h-1.5 rounded-full ${
								g.result === 'win' ? 'bg-accent-green' : 'bg-accent-red'
							}`}
							role='img'
							aria-label={`${g.result === 'win' ? 'Win' : 'Loss'} vs ${g.opponentName}`}
							title={`${g.result === 'win' ? 'W' : 'L'} vs ${g.opponentName}`}
						/>
					))}
				</div>
			</div>

			{/* Conference Record */}
			{(record.conferenceWins > 0 || record.conferenceLosses > 0) && (
				<div className='flex flex-col items-center gap-1 border-l border-foreground/15 pl-4 sm:pl-6'>
					<span className='text-[10px] text-foreground/50 uppercase tracking-widest'>
						SEC
					</span>
					<span className='text-2xl font-score text-foreground/70'>
						{record.conferenceWins}-{record.conferenceLosses}
					</span>
				</div>
			)}

			{/* Streak */}
			{record.streak > 1 && record.streakType !== 'none' && (
				<div className='flex flex-col items-center gap-2 border-l border-foreground/15 pl-4 sm:pl-6'>
					<span className='text-[10px] text-foreground/50 uppercase tracking-widest'>Streak</span>
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
