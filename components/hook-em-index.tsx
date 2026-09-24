'use client';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';
import { calculateHookEmIndex } from '../utils/seasonUtils';
import { fetchLastSeasonData } from '../hooks/fetchGameData';

interface HookEmIndexProps {
	games: Game[];
	/** Optional sizing overrides when parent controls height (e.g. desktop grid). */
	className?: string;
	/** When true, skip the glass-card chrome (parent already provides a frame). */
	bare?: boolean;
}

function AnimatedNumber({
	value,
	duration = 1.5,
}: {
	value: number;
	duration?: number;
}) {
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

const FACTOR_LABELS: Record<
	string,
	{ label: string; max: number; hint: string }
> = {
	winPercentage: {
		label: 'Win %',
		max: 40,
		hint: 'Season win rate × 40',
	},
	strengthOfVictory: {
		label: 'Quality Wins',
		max: 20,
		hint: 'Top-25 wins, weighted by rank (#1 worth more than #25)',
	},
	rivalryBonus: {
		label: 'Rivalries',
		max: 10,
		hint: 'OU & A&M only — excluded from the score until one is played',
	},
	marginFactor: {
		label: 'Margin',
		max: 15,
		hint: 'Avg point differential (all games, ±21 cap per game)',
	},
	rankingBonus: {
		label: 'Ranking',
		max: 15,
		hint: 'Current Texas ranking',
	},
};

function CircularGauge({
	score,
	grade,
	provisional,
}: {
	score: number;
	grade: string;
	provisional: boolean;
}) {
	const radius = 75;
	const stroke = 9;
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
		<div className='relative w-[170px] h-[170px] flex items-center justify-center'>
			<svg viewBox='0 0 190 190' className='-rotate-90 w-full h-full'>
				<circle
					cx='95'
					cy='95'
					r={radius}
					fill='none'
					stroke='currentColor'
					strokeWidth={stroke}
					className='text-white/5'
				/>
				<motion.circle
					cx='95'
					cy='95'
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
				{provisional && (
					<span className='mt-0.5 text-[10px] uppercase tracking-wider text-foreground/40'>
						Early season
					</span>
				)}
			</div>
		</div>
	);
}

export default function HookEmIndex({
	games,
	className,
	bare = false,
}: HookEmIndexProps) {
	const [fallbackGames, setFallbackGames] = useState<Game[] | null>(null);
	const [fallbackLoading, setFallbackLoading] = useState(false);
	const [seasonLabel, setSeasonLabel] = useState<string | null>(null);
	const [openFactor, setOpenFactor] = useState<string | null>(null);

	const completedCount = useMemo(
		() => games.filter((g) => g.status === 'STATUS_FINAL').length,
		[games],
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
					const year =
						firstDate.getMonth() >= 7
							? firstDate.getFullYear()
							: firstDate.getFullYear() - 1;
					setSeasonLabel(`${year}`);
				}
			} catch {
				// silently fail — just won't show index
			} finally {
				if (mounted) setFallbackLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [completedCount]);

	const activeGames = completedCount > 0 ? games : (fallbackGames ?? []);
	const activeCompleted = activeGames.filter(
		(g) => g.status === 'STATUS_FINAL',
	).length;
	const index = useMemo(() => calculateHookEmIndex(activeGames), [activeGames]);

	if (fallbackLoading) {
		return (
			<div
				className={`${bare ? '' : 'glass-card p-6 '}flex items-center justify-center ${className ?? ''}`}
			>
				<span className='text-foreground/40 text-sm'>Loading...</span>
			</div>
		);
	}

	if (activeCompleted === 0) {
		return (
			<div
				className={`${bare ? '' : 'glass-card p-6 '}flex items-center justify-center ${className ?? ''}`}
			>
				<span className='text-foreground/40 text-sm'>
					Play some games first
				</span>
			</div>
		);
	}

	const toggleFactor = (key: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setOpenFactor((prev) => (prev === key ? null : key));
	};

	return (
		<div
			className={`${bare ? '' : 'glass-card '}px-5 sm:px-6 xl:px-5 pt-5 pb-4 flex flex-col min-w-0 ${className ?? ''}`}
		>
			<motion.div
				className='flex flex-col items-center gap-4 md:gap-3 w-full'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				{!bare && (
					<div className='flex flex-col items-center gap-1 shrink-0'>
						<span className='text-lg font-display italic text-foreground tracking-wide text-center'>
							{seasonLabel ? `${seasonLabel} Season` : ''} Hook Them Index
						</span>
						<span className='text-[11px] text-foreground/40 text-center max-w-sm leading-relaxed'>
							Win rate, ranked wins (by opponent rank), margin, and current
							ranking
							{index.rivalryActive
								? ', plus OU/A&M rivalries'
								: ' — rivalries unlock after OU or A&M'}
						</span>
					</div>
				)}

				<div
					className={`flex flex-col items-center gap-3 w-full min-w-0 ${
						bare
							? ''
							: 'md:flex-row md:items-center md:gap-2 md:justify-start'
					}`}
				>
					<div
						className={`flex-shrink-0 flex items-center justify-center ${
							bare ? '' : 'md:w-[42%]'
						}`}
					>
						<CircularGauge
							score={index.score}
							grade={index.grade}
							provisional={index.provisional}
						/>
					</div>

					<div
						className={`flex flex-col items-center w-full min-w-0 ${
							bare
								? 'items-stretch max-w-sm'
								: 'md:items-stretch md:w-[58%] md:justify-center'
						}`}
					>
						<div
							className={`w-full min-w-0 flex flex-col gap-2.5 ${
								bare
									? ''
									: 'md:border-l md:border-foreground/10 md:pl-5 md:pr-1'
							}`}
						>
							{Object.entries(index.factors).map(([key, value]) => {
								const meta = FACTOR_LABELS[key];
								if (!meta) return null;
								const rivalryPending =
									key === 'rivalryBonus' && !index.rivalryActive;
								const pct = rivalryPending
									? 0
									: (value / meta.max) * 100;
								const isOpen = openFactor === key;
								const details =
									index.breakdowns[
										key as keyof typeof index.breakdowns
									] ?? [];

								return (
									<div
										key={key}
										className={`flex flex-col gap-1 min-w-0 ${
											rivalryPending ? 'opacity-50' : ''
										}`}
									>
										<button
											type='button'
											className='flex items-center justify-between text-left w-full min-w-0 gap-2 py-0.5 leading-none group'
											onClick={(e) => toggleFactor(key, e)}
											aria-expanded={isOpen}
										>
											<span
												className={`text-[11px] font-medium transition-colors truncate ${
													isOpen
														? 'text-foreground/85'
														: 'text-foreground/65 group-hover:text-foreground/80'
												}`}
											>
												{meta.label}
												<span
													className={`ml-1.5 ${
														isOpen
															? 'text-burntOrange/80'
															: 'text-foreground/35'
													}`}
												>
													{isOpen ? '▾' : '▸'}
												</span>
											</span>
											<span className='text-[11px] font-mono text-foreground/70 shrink-0'>
												{rivalryPending ? '—' : `${value}/${meta.max}`}
											</span>
										</button>
										<div className='h-1 w-full min-w-0 bg-white/5 rounded-full overflow-hidden'>
											<motion.div
												className='h-full max-w-full bg-burntOrange rounded-full'
												initial={{ width: 0 }}
												animate={{ width: `${pct}%` }}
												transition={{
													duration: 1,
													delay: 0.3,
													ease: 'easeOut',
												}}
											/>
										</div>
										{isOpen && (
											<div className='mt-1 mb-0.5 pl-2 border-l border-burntOrange/25 flex flex-col gap-1'>
												<p className='text-[10px] text-foreground/55 leading-relaxed'>
													{meta.hint}
												</p>
												{details.map((d, i) => (
													<div
														key={`${key}-${i}`}
														className='flex items-center justify-between gap-2'
													>
														<span className='text-[11px] text-foreground/75 truncate'>
															{d.label}
														</span>
														{d.points > 0 && (
															<span className='text-[11px] font-mono text-foreground/60 shrink-0'>
																{d.points % 1 === 0
																	? d.points
																	: d.points.toFixed(1)}
															</span>
														)}
													</div>
												))}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
