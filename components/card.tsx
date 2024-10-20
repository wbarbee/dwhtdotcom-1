'use client';
import { useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useViewport } from '../hooks/useViewport';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import FullScoreModal from './modal';
import { refetchGameData } from '../hooks/fetchGameData';
import { detectAppendedSuffix } from '../utils/stringUtils';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
import { motion, AnimatePresence } from 'framer-motion';

import { Game } from '../types';
import DevOverride from './dev-override';
import gameModes from '../constants/gameModes';

interface ScoreCardProps {
	currentGameData: Game | null;
	setCurrentGameData: (data: Game) => void;
	error: string | null;
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

export default function ScoreCard({
	currentGameData,
	setCurrentGameData,
	error,
}: ScoreCardProps) {
	const [overrideMode, setOverrideMode] = useState<
		keyof typeof gameModes | null
	>(null);
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

	const isDevMode = process.env.NODE_ENV === 'development';

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const newGameData = await refetchGameData(overrideMode || undefined);
			console.log('newGameData', newGameData);
			if (newGameData && newGameData.length > 0) {
				const currentGame = newGameData.find(
					(game) =>
						game.status === 'STATUS_CURRENT' ||
						game.status === 'STATUS_IN_PROGRESS'
				);
				if (currentGame) {
					setCurrentGameData(currentGame);
				} else {
					// If no current game, fall back to the first game in the array
					setCurrentGameData(newGameData[0]);
				}
			}
		} catch (error) {
			console.error('Failed to refresh game data:', error);
		} finally {
			setTimeout(() => {
				setIsRefreshing(false);
			}, 1000);
		}
	}, [overrideMode, setCurrentGameData]);

	const currentMode = useMemo(() => {
		if (!currentGameData) return 'auto';
		if (overrideMode) return overrideMode;
		const { status, result } = currentGameData;
		if (status === 'STATUS_CURRENT' || status === 'STATUS_IN_PROGRESS')
			return 'current';
		if (result === 'win' || result === 'loss') return result;
		return 'upcoming';
	}, [overrideMode, currentGameData]);

	const modeData = gameModes[currentMode];

	const getDynamicTitle = (mode: keyof typeof gameModes) => {
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

	if (!currentGameData) return null;

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

	const isGameInProgress =
		status !== 'STATUS_FINAL' && status !== 'STATUS_SCHEDULED';
	const showScore =
		(isGameInProgress || status === 'STATUS_FINAL') && !isRefreshing;
	const showPeriod = isGameInProgress && currentPeriod && !isRefreshing;
	const showRefreshButton = isGameInProgress;

	const backgroundImageUrl = isDarkMode
		? modeData.backgroundImageNight
		: modeData.backgroundImage;

	const formattedDate = new Date(date).toLocaleDateString();

	return (
		<>
			<DevOverride
				overrideVisible={isDevMode}
				overrideMode={overrideMode}
				refetchGameData={refetchGameData}
				setOverrideMode={setOverrideMode}
				setCurrentGameData={setCurrentGameData}
			/>
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
						<motion.div
							className='relative col-span-6 md:col-span-4 flex items-center justify-center'
							variants={itemVariants}>
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
						</motion.div>
						<motion.div
							className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'
							variants={itemVariants}>
							{modeData.title && (
								<motion.div
									className='flex flex-col mt-0 mb-0 gap-1'
									variants={itemVariants}>
									<p
										className={`text-3xl font-espn italic ${
											currentMode === 'win'
												? 'text-burntOrange dark:text-burntOrange'
												: currentMode === 'loss'
													? 'text-red-500'
													: 'text-gray-800 dark:text-gray-400 mb-2'
										} ${currentGameData.status === 'STATUS_FINAL' ? 'mb-4' : 'mb-0'}`}>
										{getDynamicTitle(currentMode)}
									</p>
								</motion.div>
							)}
							<AnimatePresence mode='wait'>
								{showScore ? (
									<motion.h1
										className='text-7xl font-medium font-oxanium'
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
									{detectAppendedSuffix(currentPeriod)} quarter
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
