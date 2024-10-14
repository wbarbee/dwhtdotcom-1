'use client';
import { Card, CardBody } from '@nextui-org/react';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import FullScoreModal from './modal';
import { useState, useEffect } from 'react';

const detectAppendedSuffix = (num: number): string => {
	if (num === 1) return '1st';
	if (num === 2) return '2nd';
	if (num === 3) return '3rd';
	return `${num}th`;
};

export default function ScoreCard() {
	const { currentGameData, error } = useCurrentGameData();
	const [viewportWidth, setViewportWidth] = useState(0);

	useEffect(() => {
		const updateViewportWidth = () => {
			setViewportWidth(window.innerWidth);
		};

		updateViewportWidth();

		window.addEventListener('resize', updateViewportWidth);

		return () => window.removeEventListener('resize', updateViewportWidth);
	}, []);

	const isMobile = viewportWidth <= 640;

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

	const appendedSuffix = currentGameData.currentPeriod
		? detectAppendedSuffix(currentGameData.currentPeriod)
		: null;

	return (
		<Card
			isBlurred
			className='border-none bg-background/60 dark:bg-default-100/50 max-w-[810px]'
			fullWidth={true}
			shadow='sm'>
			<CardBody>
				<div className='grid grid-cols-6 md:grid-cols-12 gap-4 md:gap-4 items-center justify-center'>
					<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
						<div
							className={`w-full h-full min-h-[240px] flex items-center justify-center shadow-md rounded-md ${
								currentGameData.result === 'win'
									? 'bg-[url("/images/celebration.jpeg")] bg-cover bg-center'
									: currentGameData.result === 'loss'
										? 'bg-[url("/images/hell.webp")] bg-cover bg-center'
										: 'bg-[url("/images/magic-eye-2.webp")] bg-cover bg-center'
							}`}>
							{['win', 'loss'].includes(currentGameData.result) ? (
								<span
									className={`text-7xl ${currentGameData.result === 'loss' ? 'rotate-180' : ''}`}
									role='img'
									aria-label='Hook em Horns'>
									🤘
								</span>
							) : (
								<span
									className={`text-7xl font-bold text-burntOrange animate-spin  ${currentGameData.result === 'loss' ? 'rotate-180' : ''}`}
									role='img'
									aria-label='Hook em Horns'>
									🤘
								</span>
							)}
						</div>
					</div>

					<div className='flex flex-col col-span-6 md:col-span-8 text-center pt-2 pb-4 md:py-2'>
						<div className='flex flex-col mt-0 mb-0 gap-1'>
							<p
								className={`text-3xl font-espn italic ${
									currentGameData.result === 'win'
										? 'text-burntOrange dark:text-burntOrange'
										: currentGameData.result === 'loss'
											? 'text-red-500'
											: 'text-gray-800 dark:text-gray-400 mb-2'
								}`}>
								{currentGameData.result === 'win'
									? 'We hooked them.'
									: currentGameData.result === 'loss'
										? 'We did not hook them'
										: 'UP NEXT:'}
							</p>
						</div>
						{currentGameData.homeTeamScore !== null &&
							currentGameData.awayTeamScore !== null && (
								<h1 className='text-7xl font-medium mt-4 font-oxanium'>
									{currentGameData.score}
								</h1>
							)}
						{currentGameData.status === 'STATUS_CURRENT' && appendedSuffix && (
							<h2 className='mt-1 font-oxanium font-light text-red-600'>
								{appendedSuffix} quarter
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
										: currentGameData.awayTeam}
									<span className='mx-2'>vs</span>
									<span className='font-light text-xs ml-1 mr-1'>
										[{currentGameData.homeTeamRank}]
									</span>
									{isMobile
										? currentGameData.homeTeamAbbrev
										: currentGameData.homeTeam}{' '}
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
			<div className='absolute top-[25px] md:top-auto md:bottom-2 right-[25px] md:right-2'>
				<FullScoreModal result={currentGameData.result} />
			</div>
		</Card>
	);
}
