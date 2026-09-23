'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@nextui-org/react';
import { fetchGameSummaryStats } from '../hooks/fetchGameData';
import { GameSummaryStats } from '../types';

interface GameSummaryProps {
	eventId: string;
	cached?: GameSummaryStats | null;
	onLoaded?: (stats: GameSummaryStats) => void;
}

const PERIOD_LABEL = (p: number): string => {
	if (p <= 0) return '';
	if (p >= 5) return `OT${p - 4 > 1 ? p - 4 : ''}`.trim();
	const suffix = p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th';
	return `${p}${suffix}`;
};

/**
 * Parse an ESPN stat value into a comparable number.
 * Handles plain numbers, "X-Y" efficiency ratios (as X/Y), and "MM:SS" possession
 * times (as total seconds). Returns null when nothing meaningful can be parsed.
 */
function statAsNumber(raw: string): number | null {
	if (!raw) return null;
	if (raw.includes(':')) {
		const [m, s] = raw.split(':').map(Number);
		if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
	}
	if (raw.includes('-')) {
		const [a, b] = raw.split('-').map(Number);
		if (Number.isFinite(a) && Number.isFinite(b) && b > 0) return a / b;
	}
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

/** Stats where a lower number is the "winning" side. */
const LOWER_IS_BETTER = new Set(['Turnovers']);

function pickWinner(
	label: string,
	aRaw: string | undefined,
	bRaw: string | undefined
): 'a' | 'b' | null {
	if (!aRaw || !bRaw) return null;
	const a = statAsNumber(aRaw);
	const b = statAsNumber(bRaw);
	if (a === null || b === null || a === b) return null;
	const lowerBetter = LOWER_IS_BETTER.has(label);
	if (lowerBetter) return a < b ? 'a' : 'b';
	return a > b ? 'a' : 'b';
}

export default function GameSummary({
	eventId,
	cached,
	onLoaded,
}: GameSummaryProps) {
	const [stats, setStats] = useState<GameSummaryStats | null>(cached ?? null);
	const [loading, setLoading] = useState(!cached);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (cached) {
			setStats(cached);
			setLoading(false);
			return;
		}
		let mounted = true;
		setLoading(true);
		setError(null);
		(async () => {
			try {
				const data = await fetchGameSummaryStats(eventId);
				if (!mounted) return;
				if (!data) {
					setError('No stats available.');
				} else {
					setStats(data);
					onLoaded?.(data);
				}
			} catch {
				if (!mounted) return;
				setError('Failed to load game stats.');
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventId, cached, onLoaded]);

	if (loading) {
		return (
			<div className='flex items-center justify-center py-6'>
				<Spinner size='sm' color='default' labelColor='foreground' />
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className='py-4 text-center text-xs text-foreground/40'>
				{error ?? 'No stats available.'}
			</div>
		);
	}

	const [teamA, teamB] = stats.teams;
	const labels = Array.from(
		new Set([
			...(teamA?.stats.map((s) => s.label) ?? []),
			...(teamB?.stats.map((s) => s.label) ?? []),
		])
	);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			className='w-full'
		>
			<div className='mt-1 px-1 sm:px-2 py-2 w-full'>
				{/* Team stats comparison — full-width 3-col grid, winner highlighted */}
				{teamA && teamB && labels.length > 0 && (
					<div className='w-full'>
						<div
							className='grid gap-x-4 gap-y-2 w-full items-center'
							style={{ gridTemplateColumns: '1fr auto 1fr' }}
						>
							{/* Header row */}
							<div
								className={`text-xs uppercase tracking-widest font-bold font-mono text-right ${
									teamA.isTexas ? 'text-burntOrange' : 'text-foreground/80'
								}`}
							>
								{teamA.abbreviation}
							</div>
							<div className='text-[10px] uppercase tracking-widest text-foreground/30 text-center'>
								Team Stats
							</div>
							<div
								className={`text-xs uppercase tracking-widest font-bold font-mono text-left ${
									teamB.isTexas ? 'text-burntOrange' : 'text-foreground/80'
								}`}
							>
								{teamB.abbreviation}
							</div>

							{labels.map((label) => {
								const a = teamA.stats.find((s) => s.label === label);
								const b = teamB.stats.find((s) => s.label === label);
								const winner = pickWinner(label, a?.value, b?.value);
								return (
									<div key={label} className='contents'>
										<span
											className={`text-sm font-score tabular-nums text-right ${
												winner === 'a'
													? 'text-burntOrange font-semibold'
													: 'text-foreground/70'
											}`}
										>
											{a?.value ?? '—'}
										</span>
										<span className='text-[11px] text-foreground/50 text-center whitespace-nowrap px-2'>
											{label}
										</span>
										<span
											className={`text-sm font-score tabular-nums text-left ${
												winner === 'b'
													? 'text-burntOrange font-semibold'
													: 'text-foreground/70'
											}`}
										>
											{b?.value ?? '—'}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Texas leaders */}
				{stats.texasLeaders.length > 0 && (
					<div className='mt-4 pt-3 border-t border-black/[0.06] dark:border-white/5'>
						<div className='text-[10px] uppercase tracking-widest text-burntOrange/80 mb-2'>
							Texas Leaders
						</div>
						<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
							{stats.texasLeaders.map((l) => (
								<div
									key={l.category}
									className='flex flex-col items-center text-center min-w-0'
								>
									<span className='text-[10px] uppercase tracking-wider text-foreground/40'>
										{l.category}
									</span>
									<span className='text-sm text-foreground/90 font-medium truncate max-w-full'>
										{l.athlete}
									</span>
									<span className='text-[11px] text-foreground/50 font-mono truncate max-w-full'>
										{l.displayValue}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Scoring plays */}
				{stats.scoringPlays.length > 0 && (
					<div className='mt-4 pt-3 border-t border-black/[0.06] dark:border-white/5'>
						<div className='text-[10px] uppercase tracking-widest text-foreground/40 mb-2'>
							Scoring Plays
						</div>
						<div className='flex flex-col gap-1.5'>
							{stats.scoringPlays.map((p) => (
								<div
									key={p.id}
									className='flex items-baseline gap-2 text-[11px] leading-snug'
								>
									<span className='text-foreground/30 font-mono w-12 shrink-0'>
										{PERIOD_LABEL(p.period)} {p.clock}
									</span>
									<span className='text-burntOrange font-bold shrink-0 w-10'>
										{p.teamAbbrev}
									</span>
									<span className='text-foreground/70 flex-1 min-w-0'>
										{p.text}
									</span>
									<span className='font-score text-foreground/60 tabular-nums shrink-0'>
										{p.awayScore}-{p.homeScore}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
