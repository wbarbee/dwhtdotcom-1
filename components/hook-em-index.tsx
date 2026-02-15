'use client';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '../types';
import { calculateHookEmIndex } from '../utils/seasonUtils';
import { fetchLastSeasonData } from '../hooks/fetchGameData';

interface HookEmIndexProps {
	games: Game[];
}

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
	const [display, setDisplay] = useState(0);

	useEffect(() => {
		let start = 0;
		const end = value;
		const startTime = Date.now();
		const ms = duration * 1000;

		const tick = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / ms, 1);
			// Ease out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = Math.round(start + (end - start) * eased);
			setDisplay(current);
			if (progress < 1) {
				requestAnimationFrame(tick);
			}
		};
		requestAnimationFrame(tick);
	}, [value, duration]);

	return <>{display}</>;
}

const FACTOR_LABELS: Record<string, { label: string; max: number }> = {
	winPercentage: { label: 'Win %', max: 40 },
	strengthOfVictory: { label: 'Quality Wins', max: 20 },
	rivalryBonus: { label: 'Rivalries', max: 10 },
	marginFactor: { label: 'Dominance', max: 15 },
	rankingBonus: { label: 'Ranking', max: 15 },
};

function CircularGauge({ score, grade }: { score: number; grade: string }) {
	const radius = 58;
	const stroke = 8;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	const gradeColor =
		score >= 80
			? 'text-accent-green'
			: score >= 60
				? 'text-accent-gold'
				: score >= 40
					? 'text-burntOrange'
					: 'text-accent-red';

	const strokeColor =
		score >= 80
			? '#16a34a'
			: score >= 60
				? '#d4a843'
				: score >= 40
					? '#c05700'
					: '#dc2626';

	return (
		<div className='relative w-[150px] h-[150px] flex items-center justify-center'>
			<svg width='150' height='150' className='-rotate-90'>
				<circle
					cx='75'
					cy='75'
					r={radius}
					fill='none'
					stroke='currentColor'
					strokeWidth={stroke}
					className='text-white/5'
				/>
				<motion.circle
					cx='75'
					cy='75'
					r={radius}
					fill='none'
					stroke={strokeColor}
					strokeWidth={stroke}
					strokeLinecap='round'
					strokeDasharray={circumference}
					initial={{ strokeDashoffset: circumference }}
					animate={{ strokeDashoffset: offset }}
					transition={{ duration: 1.5, ease: 'easeOut' }}
				/>
			</svg>
			<div className='absolute flex flex-col items-center'>
				<span className='text-3xl font-score font-bold text-foreground'>
					<AnimatedNumber value={score} />
				</span>
				<span className={`text-lg font-score font-bold ${gradeColor}`}>
					{grade}
				</span>
			</div>
		</div>
	);
}

export default function HookEmIndex({ games }: HookEmIndexProps) {
	const [fallbackGames, setFallbackGames] = useState<Game[] | null>(null);
	const [fallbackLoading, setFallbackLoading] = useState(false);
	const [seasonLabel, setSeasonLabel] = useState<string | null>(null);
	const [expanded, setExpanded] = useState(false);

	const completedCount = useMemo(
		() => games.filter((g) => g.status === 'STATUS_FINAL').length,
		[games]
	);

	// If no completed games in current data, fetch previous season
	useEffect(() => {
		if (completedCount > 0) {
			setFallbackGames(null);
			setSeasonLabel(null);
			return;
		}
		let mounted = true;
		setFallbackLoading(true);
		(async () => {
			try {
				const data = await fetchLastSeasonData();
				if (!mounted) return;
				const completed = data.filter((g) => g.status === 'STATUS_FINAL');
				if (completed.length > 0) {
					setFallbackGames(data);
					// Derive season year from first game
					const firstDate = new Date(data[0].date);
					const year = firstDate.getMonth() >= 7 ? firstDate.getFullYear() : firstDate.getFullYear() - 1;
					setSeasonLabel(`${year}`);
				}
			} catch {
				// silently fail — just won't show index
			} finally {
				if (mounted) setFallbackLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, [completedCount]);

	const activeGames = completedCount > 0 ? games : (fallbackGames ?? []);
	const activeCompleted = activeGames.filter((g) => g.status === 'STATUS_FINAL').length;
	const index = useMemo(() => calculateHookEmIndex(activeGames), [activeGames]);

	if (fallbackLoading) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
				<span className='text-foreground/40 text-sm'>Loading...</span>
			</div>
		);
	}

	if (activeCompleted === 0) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
				<span className='text-foreground/40 text-sm'>Play some games first</span>
			</div>
		);
	}

	return (
		<div
			className='glass-card px-6 pt-6 pb-8 cursor-pointer select-none'
			onClick={() => setExpanded((v) => !v)}
		>
			<motion.div
				className='flex flex-col items-center gap-4 w-full'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className='flex flex-col items-center gap-1'>
					<span className='text-lg font-display italic text-foreground tracking-wide'>
						{seasonLabel ? `${seasonLabel} Season` : ''} Hook Them Index
					</span>
				</div>
				<div className='flex items-center gap-4'>
					<CircularGauge score={index.score} grade={index.grade} />
				</div>
				<span className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-burntOrange/30 text-burntOrange text-xs font-medium cursor-pointer hover:bg-burntOrange/10 transition-colors'>
					{expanded ? 'tap to collapse' : 'tap for breakdown'}
					<svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><path d='M2 4l3 3 3-3'/></svg>
				</span>

				{/* Factor Breakdown — expandable */}
				<AnimatePresence>
					{expanded && (
						<motion.div
							className='w-full max-w-[320px] flex flex-col gap-3'
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.25, ease: 'easeInOut' }}
							style={{ overflow: 'hidden' }}
						>
							{Object.entries(index.factors).map(([key, value]) => {
								const meta = FACTOR_LABELS[key];
								if (!meta) return null;
								const pct = (value / meta.max) * 100;

								return (
									<div key={key} className='flex flex-col gap-1'>
										<div className='flex items-center justify-between'>
											<span className='text-xs text-foreground/50'>{meta.label}</span>
											<span className='text-xs font-mono text-foreground/60'>
												{value}/{meta.max}
											</span>
										</div>
										<div className='h-1.5 bg-white/5 rounded-full overflow-hidden'>
											<motion.div
												className='h-full bg-burntOrange rounded-full'
												initial={{ width: 0 }}
												animate={{ width: `${pct}%` }}
												transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
											/>
										</div>
									</div>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
