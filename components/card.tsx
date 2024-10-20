'use client';
import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import FullScoreModal from './modal';
import { detectAppendedSuffix } from '../utils/stringUtils';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
import { motion, AnimatePresence } from 'framer-motion';
import gameModes from '../constants/gameModes';
import Loading from './loading';

import { Game } from '../types';

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
		return isGameday ? 'pregame' : 'upcoming';
	}, [currentGameData, isGameday]);

	const modeData =
		gameModes[currentMode === 'pregame' ? 'upcoming' : currentMode];

	const getDynamicTitle = (mode: keyof typeof gameModes | 'pregame') => {
		if (mode === 'pregame') {
			return 'GAMEDAY';
		}
		if (mode === 'upcoming' && isGameday) {
			return 'GAMEDAY';
		}
		return gameModes[mode].title;
	};

	if (error) {
		return (
			<Card className='w-[300px] h-[200px] flex items-center justify-center'>
				<p className='text-danger'>{error}</p>
			</Card>
		);
	}

	if (loading || !currentGameData) {
		return <Loading />;
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
		longhornsRecord,
	} = currentGameData;

	const showScore =
		(isGameInProgress(status) || status === 'STATUS_FINAL') && !isRefreshing;
	const showPeriod = isGameInProgress(status) && !isRefreshing;
	const showRefreshButton = isGameInProgress(status);

	const backgroundImageUrl = isDarkMode
		? modeData.backgroundImageNight
		: modeData.backgroundImage;

	const formattedDate = new Date(date).toLocaleDateString();

	return (
		<>
			<Card
				isBlurred
				className='border-none bg-background/60 dark:bg-default-100/50 max-w-[810px] w-[90%] -mt-[1rem] md:mt-0'
				fullWidth
				shadow='sm'>
				<CardBody>
					<motion.div
						className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-4 items-center justify-center'
						variants={contentVariants}
						initial='hidden'
						animate='visible'>
						<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
							<div
								className='w-full h-full min-h-[240px] flex items-center justify-center shadow-md rounded-md bg-cover bg-center'
								style={{
									backgroundImage: `url(${backgroundImageUrl})`,
								}}>
								{status !== 'STATUS_SCHEDULED' && (
									<span
										className={modeData.hookEmClasses}
										role='img'
										aria-label='Hook em Horns'>
										🤘
									</span>
								)}
							</div>
						</div>
						<motion.div
							className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'
							variants={itemVariants}>
							{(modeData.title || currentMode === 'pregame') && (
								<motion.div
									className='flex flex-col mt-0 mb-0 gap-1'
									variants={itemVariants}>
									<p
										className={`text-2xl md:text-3xl font-espn italic ${
											currentMode === 'win'
												? 'text-burntOrange dark:text-burntOrange'
												: currentMode === 'loss'
													? 'text-red-500'
													: 'text-gray-800 dark:text-gray-400 mb-2'
										} ${status === 'STATUS_FINAL' ? 'mb-4' : 'mb-0'}`}>
										{getDynamicTitle(currentMode)}
									</p>
								</motion.div>
							)}
							<AnimatePresence mode='wait'>
								{showScore ? (
									<motion.h1
										className='text-6xl font-medium font-oxanium'
										key='score'
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.8 }}
										transition={{ duration: 0.3 }}>
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
								<motion.h2
									className='mt-[0.25rem] mb-[0.5rem] font-oxanium font-light text-gray-700 dark:text-gray-400'
									variants={itemVariants}>
									{currentPeriod !== null && currentPeriod > 4
										? 'OVERTIME'
										: status === 'STATUS_HALFTIME'
											? 'Halftime'
											: status === 'STATUS_END_PERIOD'
												? 'End of Quarter'
												: status === 'STATUS_PRE_END_PERIOD'
													? 'Quarter Break'
													: currentPeriod !== null
														? `${detectAppendedSuffix(currentPeriod)} quarter`
														: 'In Progress'}
								</motion.h2>
							)}
							<motion.div
								className='mt-2 flex justify-center'
								variants={itemVariants}>
								<div className='flex flex-col gap-0'>
									<h3 className='font-semibold text-foreground/90'>
										<span className='font-light text-xs ml-1 mr-1'>
											[{awayTeamRank}]
										</span>
										{isMobile ? awayTeamAbbrev : away}
										<span className='mx-2'>vs</span>
										<span className='font-light text-xs ml-1 mr-1'>
											[{homeTeamRank}]
										</span>
										{isMobile ? homeTeamAbbrev : home}
									</h3>
									<p
										className={`${
											status === 'STATUS_SCHEDULED' ? 'mt-2' : ''
										} text-sm text-foreground/80`}>
										{location} -- {formattedDate}
									</p>
									<p className='mt-3 mb-0 text-md text-gray-700 dark:text-gray-300 font-light font-menlo'>
										<span className='text-md mr-1'>🤘</span>[
										<b>{longhornsRecord}</b>]
										<span
											style={{
												transform: 'rotate(180deg)',
												display: 'inline-block',
											}}
											className='ml-1'>
											<span>🤘</span>
										</span>
									</p>
								</div>
							</motion.div>
						</motion.div>
					</motion.div>
				</CardBody>
				<div className='absolute bottom-2 right-2 flex gap-2'>
					{showRefreshButton && (
						<Button
							isIconOnly
							className='bg-transparent text-black dark:text-white rounded-full'
							size='md'
							aria-label='Refresh data'
							onClick={handleRefresh}
							isLoading={isRefreshing}>
							{!isRefreshing && <RefreshCw size={16} />}
						</Button>
					)}
					<FullScoreModal result={currentGameData.result} />
				</div>
			</Card>
		</>
	);
}
