'use client';
import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';
import { Button, Spinner } from '@nextui-org/react';
import FullScoreModal from './modal';
import { detectAppendedSuffix } from '../utils/stringUtils';
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
	if (Number(rank) >= 50) return null;
	return (
		<span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-burntOrange/15 dark:bg-burntOrange/20 text-burntOrange text-[10px] font-bold mx-1 align-middle'>
			{rank}
		</span>
	);
}

export default function ScoreCard({
	currentGameData,
	refreshData,
	error,
	loading,
}: ScoreCardProps) {
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
			<div className={`glass-card ${modeAccentClass} max-w-[465px] md:max-w-[810px] w-[90%] overflow-hidden`}>
				<motion.div
					className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-4 items-center justify-center p-5'
					variants={contentVariants}
					initial='hidden'
					animate='visible'
				>
					<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
						<div
							className='w-full h-full min-h-[240px] flex items-center justify-center rounded-lg bg-cover bg-center overflow-hidden'
							style={{
								backgroundImage: `url(${isDarkMode ? offseasonMode.backgroundImageNight : offseasonMode.backgroundImage})`,
								backgroundPosition: 'top',
								backgroundSize: 'contain',
							}}
						/>
					</div>
					<motion.div
						className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'
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
		location,
		date,
	} = currentGameData;

	const showScore =
		(isGameInProgress(status) || status === 'STATUS_FINAL') && !isRefreshing;
	const showPeriod = isGameInProgress(status) && !isRefreshing;
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

	return (
		<div className={`glass-card ${modeAccentClass} max-w-[465px] md:max-w-[810px] w-[90%] overflow-hidden relative`}>
			<div className='p-5'>
				<motion.div
					className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-4 items-center justify-center'
					variants={contentVariants}
					initial='hidden'
					animate='visible'
				>
					<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
						<div
							className='w-full h-full min-h-[240px] flex items-center justify-center rounded-lg bg-cover bg-center overflow-hidden'
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
						className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'
						variants={itemVariants}
					>
						{(modeData.title || currentMode === 'pregame') && (
							<motion.p
								className={`text-2xl md:text-4xl font-display italic tracking-wide ${titleColorClass} ${status === 'STATUS_FINAL' ? 'mb-4' : 'mb-1'}`}
								variants={itemVariants}
							>
								{getDynamicTitle(currentMode)}
							</motion.p>
						)}
						<AnimatePresence mode='wait'>
							{showScore ? (
								<motion.h1
									className='text-7xl md:text-8xl font-bold font-score tracking-tight text-foreground'
									key='score'
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									transition={{ duration: 0.3 }}
								>
									{score}
								</motion.h1>
							) : isRefreshing ? (
								<Spinner
									size='lg'
									color='default'
									labelColor='foreground'
									className='mb-6'
								/>
							) : null}
						</AnimatePresence>
						{showPeriod && (
							<motion.div
								className='mt-2 mb-3'
								variants={itemVariants}
							>
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
							className='mt-2 flex justify-center'
							variants={itemVariants}
						>
							<div className='flex flex-col gap-1'>
								<h3 className='font-semibold text-foreground/90 text-base'>
									<RankBadge rank={awayTeamRank} />
									{isMobile ? awayTeamAbbrev : away}
									<span className='mx-2 text-foreground/40 font-light'>vs</span>
									<RankBadge rank={homeTeamRank} />
									{isMobile ? homeTeamAbbrev : home}
								</h3>
								<p className={`${status === 'STATUS_SCHEDULED' ? 'mt-2' : ''} text-sm text-foreground/50 px-10`}>
									{location} &middot; {formattedDate}
								</p>
							</div>
						</motion.div>
					</motion.div>
				</motion.div>
			</div>
			<div className='absolute bottom-3 right-3 flex gap-2 z-10'>
				{showRefreshButton && (
					<Button
						isIconOnly
						className='bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-foreground/60 hover:text-foreground rounded-full backdrop-blur-sm border border-black/10 dark:border-white/15'
						size='sm'
						aria-label='Refresh data'
						onClick={handleRefresh}
						isLoading={isRefreshing}
					>
						{!isRefreshing && <RefreshCw size={14} />}
					</Button>
				)}
				<FullScoreModal result={currentGameData.result} />
			</div>
		</div>
	);
}
