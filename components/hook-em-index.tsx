'use client';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '../types';
import { calculateHookEmIndex } from '../utils/seasonUtils';
import { fetchLastSeasonData } from '../hooks/fetchGameData';

interface HookEmIndexProps {
	games: Game[];
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
		<div className='relative w-[190px] h-[190px] md:w-[220px] md:h-[220px] flex items-center justify-center'>
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

export default function HookEmIndex({ games }: HookEmIndexProps) {
	const [fallbackGames, setFallbackGames] = useState<Game[] | null>(null);
	const [fallbackLoading, setFallbackLoading] = useState(false);
	const [seasonLabel, setSeasonLabel] = useState<string | null>(null);
	const [expanded, setExpanded] = useState(false);
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
			<div className='glass-card p-6 flex items-center justify-center'>
				<span className='text-foreground/40 text-sm'>Loading...</span>
			</div>
		);
	}

	if (activeCompleted === 0) {
		return (
			<div className='glass-card p-6 flex items-center justify-center'>
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
			className='glass-card px-6 md:px-2 pt-6 pb-4 cursor-pointer select-none'
			onClick={() => setExpanded((v) => !v)}
		>
			<motion.div
				className='flex flex-col items-center gap-4 md:gap-2 w-full'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className='flex flex-col items-center gap-1'>
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

				{/* Desktop: side-by-side layout / Mobile: stacked */}
				<div className='flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-0 w-full md:px-4 md:pt-2'>
					{/* Gauge */}
					<div className='flex-shrink-0 md:w-[38%] flex items-center justify-center md:py-2'>
						<CircularGauge
							score={index.score}
							grade={index.grade}
							provisional={index.provisional}
						/>
					</div>

					{/* Factor Breakdown — always visible on desktop, expandable on mobile */}
					<div className='flex flex-col items-center md:items-stretch w-full md:w-[62%] md:justify-start md:pt-3'>
						<span className='inline-flex md:hidden items-center gap-1.5 px-4 py-1.5 mb-3 rounded-full border border-burntOrange/30 text-burntOrange text-xs font-medium cursor-pointer hover:bg-burntOrange/10 transition-colors'>
							{expanded ? 'tap to collapse' : 'tap for breakdown'}
							<svg
								width='10'
								height='10'
								viewBox='0 0 10 10'
								fill='none'
								stroke='currentColor'
								strokeWidth='1.5'
								strokeLinecap='round'
								strokeLinejoin='round'
								className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
							>
								<path d='M2 4l3 3 3-3' />
							</svg>
						</span>

						{/* Desktop: always show / Mobile: expandable */}
						<AnimatePresence>
							{(expanded || typeof window !== 'undefined') && (
								<motion.div
									className={`w-full flex-col gap-3 md:border-l md:border-foreground/10 md:px-10 ${expanded ? 'flex' : 'hidden md:flex'}`}
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.25, ease: 'easeInOut' }}
									style={{ overflow: 'hidden' }}
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
												className={`flex flex-col gap-1 ${rivalryPending ? 'opacity-50' : ''}`}
											>
												<button
													type='button'
													className='flex items-center justify-between text-left w-full group'
													onClick={(e) => toggleFactor(key, e)}
													aria-expanded={isOpen}
												>
													<span className='text-xs text-foreground/50 group-hover:text-foreground/70 transition-colors'>
														{meta.label}
														<span className='ml-1 text-foreground/25'>
															{isOpen ? '▾' : '▸'}
														</span>
													</span>
													<span className='text-xs font-mono text-foreground/60'>
														{rivalryPending ? '—' : `${value}/${meta.max}`}
													</span>
												</button>
												<div className='h-1.5 bg-white/5 rounded-full overflow-hidden'>
													<motion.div
														className='h-full bg-burntOrange rounded-full'
														initial={{ width: 0 }}
														animate={{ width: `${pct}%` }}
														transition={{
															duration: 1,
															delay: 0.3,
															ease: 'easeOut',
														}}
													/>
												</div>
												<AnimatePresence>
													{isOpen && (
														<motion.div
															className='pl-1 pt-1 pb-0.5 flex flex-col gap-0.5'
															initial={{ height: 0, opacity: 0 }}
															animate={{ height: 'auto', opacity: 1 }}
															exit={{ height: 0, opacity: 0 }}
															transition={{ duration: 0.2 }}
															onClick={(e) => e.stopPropagation()}
														>
															<p className='text-[10px] text-foreground/35 mb-0.5'>
																{meta.hint}
															</p>
															{details.map((d, i) => (
																<div
																	key={`${key}-${i}`}
																	className='flex items-center justify-between gap-2'
																>
																	<span className='text-[11px] text-foreground/45 truncate'>
																		{d.label}
																	</span>
																	{d.points > 0 && (
																		<span className='text-[11px] font-mono text-foreground/40 shrink-0'>
																			{d.points % 1 === 0
																				? d.points
																				: d.points.toFixed(1)}
																		</span>
																	)}
																</div>
															))}
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										);
									})}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
