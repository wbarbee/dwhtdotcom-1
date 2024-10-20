'use client';
import { useEffect } from 'react';
import ScoreCard from '../components/card';
import Loading from '../components/loading';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';

export default function Home() {
	const { currentGameData, loading, error, refreshData } = useCurrentGameData();

	useEffect(() => {
		console.log('Current game data in Home component:', currentGameData);
	}, [currentGameData]);

	if (loading) return <Loading />;

	return (
		<div className='relative w-full h-full'>
			<div className='absolute top-4 right-4'>
				{/* Add any top-right corner elements here */}
			</div>
			<div className='flex items-center justify-center w-full h-full'>
				<ScoreCard
					currentGameData={currentGameData}
					refreshData={refreshData}
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
