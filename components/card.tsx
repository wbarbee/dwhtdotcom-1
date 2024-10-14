'use client';
import { Card, CardBody } from '@nextui-org/react';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import FullScoreModal from './modal';

export default function ScoreCard() {
	const { currentGameData, error } = useCurrentGameData();

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

	return (
		<Card
			isBlurred
			className='border-none bg-background/60 dark:bg-default-100/50 max-w-[810px]'
			fullWidth={true}
			shadow='sm'>
			<CardBody>
				<div className='grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center'>
					<div className='relative col-span-6 md:col-span-4 flex items-center justify-center'>
						<div
							className={`w-full h-[200px] flex items-center justify-center shadow-md rounded-md ${currentGameData.result === 'win' ? 'bg-burntOrange' : currentGameData.result === 'loss' ? 'red' : 'white'}`}>
							{['win', 'loss'].includes(currentGameData.result) ? (
								<span
									className={`text-7xl ${currentGameData.result === 'loss' ? 'rotate-180' : ''}`}
									role='img'
									aria-label='Hook em Horns'>
									🤘
								</span>
							) : (
								<span
									className={`text-7xl font-bold text-burntOrange animate-pulse-opacity  ${currentGameData.result === 'loss' ? 'rotate-180' : ''}`}
									role='img'
									aria-label='Hook em Horns'>
									🤘?
								</span>
							)}
						</div>
					</div>

					<div className='flex flex-col col-span-6 md:col-span-8 text-center py-8 md:py-0'>
						<div className='flex flex-col mt-0 mb-0 gap-1'>
							<p
								className={`text-3xl font-espn ${
									currentGameData.result === 'win'
										? 'text-burntOrange'
										: 'text-red-500'
								}`}>
								{currentGameData.result
									? 'We hooked them.'
									: 'We did not hook them'}
							</p>
						</div>
						<h1 className='text-7xl font-medium mt-4 mb-3 font-oxanium'>
							{currentGameData.homeTeamScore} - {currentGameData.awayTeamScore}
						</h1>
						{currentGameData.status === 'STATUS_CURRENT' && <h2>{} period</h2>}
						<div className='flex justify-center'>
							<div className='flex flex-col gap-0'>
								<h3 className='font-semibold text-foreground/90'>
									{currentGameData.home}{' '}
									<span className='font-light text-xs ml-1 mr-1'>
										[{currentGameData.homeTeamRank}]
									</span>{' '}
									vs {currentGameData.away}
									<span className='font-light text-xs ml-1 mr-1'>
										[{currentGameData.awayTeamRank}]
									</span>
								</h3>
								<p className='text-small text-foreground/80'>
									{currentGameData.location} -- {currentGameData.date}
								</p>
							</div>
						</div>
					</div>
				</div>
			</CardBody>
			<div className='absolute top-5 md:top-auto md:bottom-2 right-[20px] md:right-2'>
				<FullScoreModal />
			</div>
		</Card>
	);
}
