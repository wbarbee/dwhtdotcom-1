'use client';
import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import FullScoreModal from './modal';
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from '@nextui-org/react';
import { refetchGameData } from '@/hooks/fetchGameData';
import { detectAppendedSuffix } from '@/utils/stringUtils';

import { Game } from '@/types';

interface ScoreCardProps {
	currentGameData: Game | null;
	setCurrentGameData: (data: Game) => void;
	error: string | null;
}

export default function ScoreCard({
	currentGameData,
	setCurrentGameData,
	error,
}: ScoreCardProps) {
	const [overrideVisible] = useState(process.env.NODE_ENV === 'development');
	const [overrideMode, setOverrideMode] = useState<
		keyof typeof gameModes | null
	>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { isMobile } = useViewport();

	const handleRefresh = async () => {
		setIsRefreshing(true);
		await refetchGameData();
		setTimeout(() => setIsRefreshing(false), 1000);
	};

	const handleOverrideChange = async (key: string) => {
		const newMode = key === 'auto' ? null : (key as keyof typeof gameModes);
		setOverrideMode(newMode);
		if (
			process.env.NODE_ENV === 'development' &&
			process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
		) {
			const newData = await refetchGameData(newMode as string | undefined);
			if (newData && newData.length > 0) {
				const relevantGame = newData.find(
					(game) =>
						game.status === 'STATUS_CURRENT' ||
						(game.status === 'STATUS_FINAL' &&
							new Date(game.date).getTime() >
								Date.now() - 48 * 60 * 60 * 1000) ||
						game.status === 'STATUS_SCHEDULED'
				);
				if (relevantGame) setCurrentGameData(relevantGame);
			}
		}
	};

	const currentMode = useMemo(() => {
		if (!currentGameData) return 'auto';
		if (overrideMode) return overrideMode;
		if (currentGameData.status === 'STATUS_CURRENT') return 'current';
		if (currentGameData.result === 'win' || currentGameData.result === 'loss')
			return currentGameData.result;
		return 'upcoming';
	}, [overrideMode, currentGameData]);

	const gameModes = {
		win: {
			backgroundImage: 'bg-[url("/images/celebration.jpeg")]',
			backgroundImageNight: 'dark:bg-[url("/images/celebration.jpeg")]',
			title: 'We hooked them.',
			hookEmClasses: 'text-7xl',
		},
		loss: {
			backgroundImage: 'bg-[url("/images/hell.webp")]',
			backgroundImageNight: 'dark:bg-[url("/images/hell.webp")]',
			title: 'We did not hook them',
			hookEmClasses: 'text-7xl rotate-180',
		},
		upcoming: {
			backgroundImage: 'bg-[url("/images/magic-eye-2.webp")]',
			backgroundImageNight: 'dark:bg-[url("/images/magic-eye-2.webp")]',
			title: 'UP NEXT:',
			hookEmClasses: 'text-7xl animate-spin',
		},
		current: {
			backgroundImage: 'bg-[url("/images/mem_stadium-day.webp")]',
			backgroundImageNight: 'dark:bg-[url("/images/mem_stadium.webp")]',
			title: '',
			hookEmClasses: 'text-7xl animate-pulse',
		},
		auto: {
			backgroundImage: '',
			backgroundImageNight: '',
			title: '',
			hookEmClasses: 'text-7xl',
		},
	};

	const modeData = gameModes[currentMode];

	if (!currentGameData) return null;
	if (error)
		return (
			<Card className='w-[300px] h-[200px] flex items-center justify-center'>
				<p className='text-danger'>{error}</p>
			</Card>
		);

	return (
		<>
			{overrideVisible && (
				<div className='fixed bottom-3 left-3'>
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant='bordered'
								className='bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.6)] border-none rounded-[3px]'>
								{overrideMode || 'auto (no override)'}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Game mode selection'
							onAction={(key) => handleOverrideChange(key.toString())}>
							{Object.keys(gameModes).map((mode) => (
								<DropdownItem key={mode}>{mode}</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
				</div>
			)}
			<Card
				isBlurred
				className='border-none bg-background/60 dark:bg-default-100/50 max-w-[810px]'
				fullWidth={true}
				shadow='sm'>
				<CardBody>
					<div className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-4 items-center justify-center'>
						<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
							<div
								className={`w-full h-full min-h-[240px] flex items-center justify-center shadow-md rounded-md bg-cover bg-center ${modeData.backgroundImage} ${modeData.backgroundImageNight}`}>
								<span
									className={modeData.hookEmClasses}
									role='img'
									aria-label='Hook em Horns'>
									🤘
								</span>
							</div>
						</div>
						<div className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'>
							<div className='flex flex-col mt-0 mb-0 gap-1'>
								<p
									className={`text-3xl font-espn italic ${
										currentMode === 'win'
											? 'text-burntOrange dark:text-burntOrange'
											: currentMode === 'loss'
												? 'text-red-500'
												: 'text-gray-800 dark:text-gray-400 mb-2'
									} ${currentGameData.status === 'STATUS_FINAL' ? 'mb-4' : 'mb-0'}`}>
									{modeData.title}
								</p>
							</div>
							{['STATUS_CURRENT', 'STATUS_FINAL'].includes(
								currentGameData.status
							) &&
								(isRefreshing ? (
									<Spinner
										size='lg'
										color='default'
										labelColor='foreground'
										className='mb-6'
									/>
								) : (
									<h1 className='text-7xl font-medium font-oxanium animate-fade-in'>
										{currentGameData.score}
									</h1>
								))}
							{currentGameData.status === 'STATUS_CURRENT' &&
								currentGameData.currentPeriod &&
								!isRefreshing && (
									<h2 className='mt-[0.25rem] mb-[0.5rem] font-oxanium font-light text-gray-700 dark:text-gray-400 animate-fade-in'>
										{detectAppendedSuffix(currentGameData.currentPeriod)}{' '}
										quarter
									</h2>
								)}
							<div className='mt-2 flex justify-center'>
								<div className='flex flex-col gap-0'>
									<h3 className='font-semibold text-foreground/90'>
										<span className='font-light text-xs ml-1 mr-1'>
											[{currentGameData.awayTeamRank}]
										</span>
										{isMobile
											? currentGameData.awayTeamAbbrev
											: currentGameData.away}
										<span className='mx-2'>vs</span>
										<span className='font-light text-xs ml-1 mr-1'>
											[{currentGameData.homeTeamRank}]
										</span>
										{isMobile
											? currentGameData.homeTeamAbbrev
											: currentGameData.home}
									</h3>
									<p
										className={`${currentGameData.status === 'STATUS_SCHEDULED' ? 'mt-2' : ''} text-small text-foreground/80`}>
										{currentGameData.location} -- {currentGameData.date}
									</p>
									<p className='mt-3 mb-0 text-md font-light'>
										<span className='text-md mr-1'>🤘</span>[
										<b>{currentGameData.longhornsRecord}</b>]
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
							</div>
						</div>
					</div>
				</CardBody>
				<div className='absolute bottom-2 right-2 flex gap-2'>
					{currentGameData.status === 'STATUS_CURRENT' && (
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
