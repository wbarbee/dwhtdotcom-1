'use client';
import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';
import { Spinner } from '@nextui-org/react';
import FullScoreModal from './modal';
import { ThemeSwitch, scoreboardControlClass, scoreboardToolbarClass } from './theme-switch';
import { detectAppendedSuffix } from '../utils/stringUtils';
import { normalizeRank } from '../utils/rankUtils';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
import { motion, AnimatePresence } from 'framer-motion';

import { Game } from '../types';
import gameModes from '../constants/gameModes';
import Loading from './loading';

interface ScoreCardProps {
	currentGameData: Game | null;
	refreshData: () => Promise<void>;
	error: string | null;
	loading: boolean;
	/** Optional width/height overrides when parent controls sizing (e.g. desktop grid). */
	className?: string;
}

const contentVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, staggerChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.3 },
	},
};

const isGameInProgress = (status: Game['status']) =>
	[
		'STATUS_IN_PROGRESS',
		'STATUS_HALFTIME',
		'STATUS_CURRENT',
		'STATUS_END_PERIOD',
		'STATUS_PRE_END_PERIOD',
		'STATUS_FIRST_QUARTER',
		'STATUS_SECOND_QUARTER',
		'STATUS_THIRD_QUARTER',
		'STATUS_FOURTH_QUARTER',
		'STATUS_OVERTIME',
	].includes(status);

function RankBadge({ rank }: { rank: number }) {
	const normalized = normalizeRank(rank);
	if (normalized === null) return null;
	return (
		<span className='inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full bg-burntOrange/15 dark:bg-burntOrange/20 text-burntOrange text-[10px] font-bold'>
			{normalized}
		</span>
	);
}

function ScoreDisplay({
	awayScore,
	homeScore,
	fallback,
}: {
	awayScore: number | null;
	homeScore: number | null;
	fallback: string;
}) {
	if (awayScore === null || homeScore === null) {
		return (
			<span className='text-5xl md:text-6xl font-bold font-score tracking-tight text-foreground whitespace-nowrap tabular-nums'>
				{fallback.replace(/ - /g, '–')}
			</span>
		);
	}
	return (
		<div
			className='flex items-baseline justify-center gap-2 md:gap-3 whitespace-nowrap'
			aria-label={`${awayScore} to ${homeScore}`}
		>
			<span className='text-5xl md:text-6xl font-bold font-score tracking-tight text-foreground tabular-nums'>
				{awayScore}
			</span>
			<span className='text-3xl md:text-4xl font-score text-foreground/30'>–</span>
			<span className='text-5xl md:text-6xl font-bold font-score tracking-tight text-foreground tabular-nums'>
				{homeScore}
			</span>
		</div>
	);
}

function MatchupLine({
	awayRank,
	awayLabel,
	homeRank,
	homeLabel,
}: {
	awayRank: number;
	awayLabel: string;
	homeRank: number;
	homeLabel: string;
}) {
	return (
		<div className='flex items-center justify-center gap-2 text-sm font-semibold text-foreground/90 whitespace-nowrap'>
			<span className='inline-flex items-center gap-1.5 min-w-0'>
				<RankBadge rank={awayRank} />
				<span className='truncate'>{awayLabel}</span>
			</span>
			<span className='text-[10px] uppercase tracking-[0.18em] text-foreground/35 font-medium shrink-0'>
				vs
			</span>
			<span className='inline-flex items-center gap-1.5 min-w-0'>
				<RankBadge rank={homeRank} />
				<span className='truncate'>{homeLabel}</span>
			</span>
		</div>
	);
}

export default function ScoreCard({
	currentGameData,
	refreshData,
	error,
	loading,
	className,
}: ScoreCardProps) {
	const shellClass =
		className ?? 'max-w-[465px] md:max-w-[810px] w-[90%]';
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { isMobile } = useViewport();
	const isDarkMode = useIsDarkMode();

	const isGameday = useMemo(() => {
		if (!currentGameData) return false;
		const gameDate = new Date(currentGameData.date);
		const today = new Date();
		return (
			gameDate.getDate() === today.getDate() &&
			gameDate.getMonth() === today.getMonth() &&
			gameDate.getFullYear() === today.getFullYear()
		);
	}, [currentGameData]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await refreshData();
		} catch (error) {
			console.error('Failed to refresh game data:', error);
		} finally {
			setTimeout(() => {
				setIsRefreshing(false);
			}, 1000);
		}
	}, [refreshData]);

	const currentMode = useMemo(() => {
		if (!currentGameData) return 'auto';
		const { status, result } = currentGameData;
		if (isGameInProgress(status)) return 'current';
		if (result === 'win' || result === 'loss') return result;
		if (isGameday && status === 'STATUS_SCHEDULED') return 'pregame';
		return 'upcoming';
	}, [currentGameData, isGameday]);

	const modeData =
		gameModes[currentMode === 'pregame' ? 'upcoming' : currentMode];

	const getDynamicTitle = (mode: keyof typeof gameModes | 'pregame') => {
		if (mode === 'pregame') return 'GAMEDAY';
		if (mode === 'upcoming' && isGameday) return 'GAMEDAY';
		return gameModes[mode].title;
	};

	const modeAccentClass = useMemo(() => {
		switch (currentMode) {
			case 'win':
				return 'border-accent-green/20';
			case 'loss':
				return 'border-accent-red/20';
			case 'current':
				return 'border-burntOrange/30 animate-glow-pulse';
			default:
				return 'border-white/10 dark:border-white/5';
		}
	}, [currentMode]);

	if (error) {
		return (
			<div className='glass-card p-8 flex items-center justify-center'>
				<p className='text-accent-red'>{error}</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className='w-full h-full flex items-center justify-center'>
				<Loading />
			</div>
		);
	}

	if (!currentGameData) {
		const offseasonMode = gameModes.offseason;
		return (
			<div
				className={`glass-card ${modeAccentClass} ${shellClass} overflow-hidden relative flex flex-col`}
			>
				<motion.div
					className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-5 items-center justify-center p-5 flex-1 min-h-0'
					variants={contentVariants}
					initial='hidden'
					animate='visible'
				>
					<div className='relative col-span-6 md:col-span-5 flex items-center justify-center'>
						<div
							className='w-full aspect-[3/4] max-h-[340px] flex items-center justify-center rounded-lg bg-cover bg-center overflow-hidden'
							style={{
								backgroundImage: `url(${isDarkMode ? offseasonMode.backgroundImageNight : offseasonMode.backgroundImage})`,
								backgroundPosition: 'top',
								backgroundSize: 'contain',
							}}
						/>
					</div>
					<motion.div
						className='flex flex-col col-span-6 md:col-span-7 items-center text-center gap-3 px-1'
						variants={itemVariants}
					>
						<motion.p
							className='text-2xl md:text-3xl font-display italic text-foreground/60 mb-3'
							variants={itemVariants}
						>
							{offseasonMode.title}
						</motion.p>
						<motion.div className='flex flex-col gap-2' variants={itemVariants}>
							<p className='text-md text-foreground/80 font-gothic'>
								Check back when the season starts
							</p>
							<p className='text-sm text-foreground/50 font-gothic'>
								We'll have live game updates and scores
							</p>
						</motion.div>
						<motion.div className='mt-5 px-4' variants={itemVariants}>
							<FullScoreModal variant='wide' />
						</motion.div>
					</motion.div>
				</motion.div>
				<div className='flex justify-end px-3 pb-3 pt-1'>
					<div className={scoreboardToolbarClass}>
						<ThemeSwitch />
					</div>
				</div>
			</div>
		);
	}

	const {
		status,
		score,
		currentPeriod,
		home,
		away,
		homeTeamRank,
		awayTeamRank,
		homeTeamAbbrev,
		awayTeamAbbrev,
		homeTeamScore,
		awayTeamScore,
		location,
		date,
	} = currentGameData;

	const showScore =
		(isGameInProgress(status) || status === 'STATUS_FINAL') && !isRefreshing;
	const showPeriod = isGameInProgress(status) && !isRefreshing;
	// Manual refresh is only useful mid-game; hide it for finals / upcoming
	const showRefreshButton = isGameInProgress(status);

	const backgroundImageUrl = isDarkMode
		? modeData.backgroundImageNight
		: modeData.backgroundImage;

	const formattedDate = new Date(date).toLocaleDateString();

	const titleColorClass =
		currentMode === 'win'
			? 'text-gradient-orange'
			: currentMode === 'loss'
				? 'text-accent-red'
				: 'text-foreground/60';

	const awayLabel = isMobile ? awayTeamAbbrev : away;
	const homeLabel = isMobile ? homeTeamAbbrev : home;
	// Half-width desktop column can't fit full names — prefer abbrevs when constrained.
	const compactAway = awayTeamAbbrev || away;
	const compactHome = homeTeamAbbrev || home;

	return (
		<div
			className={`glass-card ${modeAccentClass} ${shellClass} overflow-hidden relative flex flex-col`}
		>
			<div className='p-4 flex-1 min-h-0 flex flex-col'>
				<motion.div
					className='grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-stretch w-full flex-1 min-h-0'
					variants={contentVariants}
					initial='hidden'
					animate='visible'
				>
					<div className='relative md:col-span-5 flex min-h-[200px] md:min-h-0 md:h-full'>
						<div
							className='w-full h-full min-h-[200px] aspect-[3/4] max-h-[260px] md:aspect-auto md:max-h-none md:min-h-0 rounded-lg bg-cover bg-center overflow-hidden flex items-center justify-center'
							style={{
								backgroundImage: `url(${backgroundImageUrl})`,
							}}
						>
							{status !== 'STATUS_SCHEDULED' && (
								<span
									className={modeData.hookEmClasses}
									role='img'
									aria-label='Hook em Horns'
								>
									🤘
								</span>
							)}
						</div>
					</div>
					<motion.div
						className='flex flex-col md:col-span-7 items-center justify-center text-center gap-3 px-1 pb-10 min-w-0'
						variants={itemVariants}
					>
						{(modeData.title || currentMode === 'pregame') && (
							<motion.p
								className={`text-xl md:text-2xl font-display italic tracking-wide ${titleColorClass}`}
								variants={itemVariants}
							>
								{getDynamicTitle(currentMode)}
							</motion.p>
						)}
						<AnimatePresence mode='wait'>
							{showScore ? (
								<motion.div
									key='score'
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									transition={{ duration: 0.3 }}
								>
									<ScoreDisplay
										awayScore={awayTeamScore}
										homeScore={homeTeamScore}
										fallback={score}
									/>
								</motion.div>
							) : isRefreshing ? (
								<Spinner
									size='lg'
									color='default'
									labelColor='foreground'
								/>
							) : null}
						</AnimatePresence>
						{showPeriod && (
							<motion.div variants={itemVariants}>
								<span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burntOrange/10 dark:bg-burntOrange/15 text-burntOrange text-sm font-score font-medium'>
									<span className='w-2 h-2 rounded-full bg-burntOrange animate-pulse' />
									{currentPeriod !== null && currentPeriod > 4
										? 'OVERTIME'
										: status === 'STATUS_HALFTIME'
											? 'Halftime'
											: status === 'STATUS_END_PERIOD'
												? 'End of Quarter'
												: status === 'STATUS_PRE_END_PERIOD'
													? 'Quarter Break'
													: currentPeriod !== null
														? `${detectAppendedSuffix(currentPeriod)} Quarter`
														: 'In Progress'}
								</span>
							</motion.div>
						)}
						<motion.div
							className='flex flex-col items-center gap-2 w-full min-w-0'
							variants={itemVariants}
						>
							<div className='md:hidden w-full px-1'>
								<MatchupLine
									awayRank={awayTeamRank}
									awayLabel={awayLabel}
									homeRank={homeTeamRank}
									homeLabel={homeLabel}
								/>
							</div>
							<div className='hidden md:block w-full px-1'>
								<MatchupLine
									awayRank={awayTeamRank}
									awayLabel={compactAway}
									homeRank={homeTeamRank}
									homeLabel={compactHome}
								/>
							</div>
							{/* Stacked on phones: a long venue name plus the date on one
							    line wraps mid-name and strands the separator. */}
							<div
								className={`${status === 'STATUS_SCHEDULED' ? 'mt-1' : ''} flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-2 px-2 text-sm text-foreground/50`}
							>
								<span className='text-balance'>{location}</span>
								<span
									className='hidden sm:inline text-foreground/30'
									aria-hidden='true'
								>
									&middot;
								</span>
								<span>{formattedDate}</span>
							</div>
						</motion.div>
					</motion.div>
				</motion.div>
			</div>

			<div className={`absolute bottom-3 right-3 z-10 ${scoreboardToolbarClass}`}>
				{showRefreshButton && (
					<button
						type='button'
						className={scoreboardControlClass}
						aria-label='Refresh data'
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<RefreshCw
							size={15}
							strokeWidth={1.75}
							className={isRefreshing ? 'animate-spin' : undefined}
						/>
					</button>
				)}
				<FullScoreModal result={currentGameData.result} />
				<ThemeSwitch />
			</div>
		</div>
	);
}
