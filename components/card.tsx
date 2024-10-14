'use client';
import { useState, useEffect } from 'react';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import { Card, CardBody } from '@nextui-org/react';
import FullScoreModal from './modal';
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from '@nextui-org/react';

const detectAppendedSuffix = (num: number): string => {
	if (num === 1) return '1st';
	if (num === 2) return '2nd';
	if (num === 3) return '3rd';
	return `${num}th`;
};

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
		title: 'auto (no override)',
		hookEmClasses: 'text-7xl',
	},
};

export default function ScoreCard() {
	const { currentGameData, error } = useCurrentGameData();
	const [overrideVisible] = useState(process.env.NODE_ENV === 'development');
	const [_, setViewportWidth] = useState(0);
	const [overrideMode, setOverrideMode] = useState<
		keyof typeof gameModes | null
	>(null);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const updateViewportWidth = () => {
			setViewportWidth(window.innerWidth);
		};

		updateViewportWidth();

		window.addEventListener('resize', updateViewportWidth);

		return () => window.removeEventListener('resize', updateViewportWidth);
	}, []);

	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth <= 640);
		};

		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);

		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	if (!currentGameData) {
		return null;
	}

	if (error) {
		return (
			<Card className='w-[300px] h-[200px] flex items-center justify-center'>
				<p className='text-danger'>{error}</p>
			</Card>
		);
	}

	const currentMode =
		overrideMode ||
		(currentGameData.status === 'STATUS_CURRENT'
			? 'current'
			: currentGameData.result === 'win' || currentGameData.result === 'loss'
				? currentGameData.result
				: 'upcoming');

	const modeData = gameModes[currentMode as keyof typeof gameModes];

	return (
		<>
			{overrideVisible && (
				<div className='mb-4 fixed bottom-4 left-4'>
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant='bordered'
								className='bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.6)] border-none rounded-[3px]'>
								{overrideMode || 'Auto (No Override)'}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Game mode selection'
							onAction={(key) =>
								setOverrideMode(
									key === 'auto' ? null : (key as keyof typeof gameModes)
								)
							}>
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
								className={`w-full h-full min-h-[240px] flex items-center justify-center shadow-md rounded-md bg-cover bg-center ${modeData?.backgroundImage} ${modeData?.backgroundImageNight}`}>
								<span
									className={modeData?.hookEmClasses}
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
											? 'text-burntOrange dark:text-burntOrange mb-1'
											: currentMode === 'loss'
												? 'text-red-500 mb-1'
												: 'text-gray-800 dark:text-gray-400 mb-2'
									}`}>
									{modeData?.title}
								</p>
							</div>
							{currentGameData.homeTeamScore !== null &&
								currentGameData.awayTeamScore !== null && (
									<h1 className='text-7xl font-medium mt-4 font-oxanium'>
										{currentGameData.score}
									</h1>
								)}
							{currentGameData.status === 'STATUS_CURRENT' &&
								currentGameData.currentPeriod && (
									<h2 className='mt-1 font-oxanium font-light text-red-600'>
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
											: currentGameData.home}{' '}
									</h3>
									<p
										className={`${currentGameData.status === 'STATUS_SCHEDULED' ? 'mt-2' : ''} text-small text-foreground/80`}>
										{currentGameData.location} -- {currentGameData.date}
									</p>
									<p className='mt-2 mb-0 text-md font-light'>
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
				<div className='absolute bottom-2 right-[25px] md:right-2'>
					<FullScoreModal result={currentGameData.result} />
				</div>
			</Card>
		</>
	);
}
