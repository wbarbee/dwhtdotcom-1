'use client';
import { useEffect, useState } from 'react';
import ScoreCard from '../components/card';
import Loading from '../components/loading';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import useGameData from '../hooks/useGameData';
import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';
import { Game } from '../types';

export default function Home() {
	const { fullGameDataIsLoading } = useGameData();
	const { currentGameData, setCurrentGameData, error, loading } =
		useCurrentGameData();
	const [localGameData, setLocalGameData] = useState<Game | null>(null);

	useEffect(() => {
		console.log('Home component rendered');
		console.log('Current game data:', currentGameData);
	});

	useEffect(() => {
		if (currentGameData) {
			console.log('Updating local game data');
			setLocalGameData(currentGameData);
		}
	}, [currentGameData]);

	if (fullGameDataIsLoading || loading) {
		console.log('Loading...');
		return <Loading />;
	}

	console.log('Rendering ScoreCard with data:', localGameData);

	return (
		<div className='relative w-full h-full'>
			<div className='absolute top-4 right-4'>
				{/* Add any top-right corner elements here */}
			</div>
			<div className='flex items-center justify-center w-full h-full'>
				<ScoreCard
					currentGameData={localGameData}
					setCurrentGameData={setCurrentGameData}
					error={error}
				/>
			</div>
			<div className='absolute bottom-4 left-4'>
				{/* Add any bottom-left corner elements here */}
			</div>
			<div className='absolute bottom-4 right-4'>
				<Tooltip
					content={
						<div
							className='font-menlo text-xs text-center py-2'
							color='default'>
							&copy; {new Date().getFullYear()} didwehookthem.com. All rights
							reserved.
							<br />
							<Link
								href='/about'
								className='font-menlo text-xs mt-1'
								underline='always'>
								Click for more info
							</Link>
						</div>
					}>
					<Button
						href='/about'
						as={Link}
						isIconOnly
						aria-label='About question mark'
						color='default'
						variant='solid'
						className='rounded-full min-w-0 text-xs p-2 w-[25px] h-[25px] opacity-60 hover:opacity-100 transition-all ease-in-out duration-400 z-[40]'>
						?
					</Button>
				</Tooltip>
			</div>
		</div>
	);
}
