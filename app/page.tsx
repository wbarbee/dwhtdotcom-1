'use client';
import { useEffect, useState } from 'react';
import ScoreCard from '../components/card';
import DevOverride from '../components/dev-override';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';
import { Game } from '../types';

export default function Home() {
	const { currentGameData, loading, error, refreshData, overrideMode } =
		useCurrentGameData();
	const [overrideVisible, setOverrideVisible] = useState(false);

	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			setOverrideVisible(true);
		} else {
			setOverrideVisible(false);
		}

		// Log debug information
		console.log('IS_DEV_MODE:', process.env.NODE_ENV === 'development');
		console.log(
			'USE_MOCK_DATA:',
			process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
		);
		console.log('Current overrideMode:', overrideMode);
	}, [overrideMode]);

	const handleRefreshData = async (
		newOverrideMode?: string,
		setIsRefreshing?: (isRefreshing: boolean) => void
	) => {
		if (setIsRefreshing) setIsRefreshing(true);
		try {
			await refreshData(newOverrideMode);
			// Log the new override mode
			console.log('New overrideMode:', newOverrideMode);
		} finally {
			if (setIsRefreshing) setIsRefreshing(false);
		}
	};

	return (
		<div className='relative w-full h-full'>
			<DevOverride
				overrideVisible={overrideVisible}
				currentOverrideMode={overrideMode}
				refreshData={handleRefreshData}
			/>
			<div className='absolute top-4 right-4'>
				{/* Add any top-right corner elements here */}
			</div>
			<div className='flex items-center justify-center w-full h-full'>
				<ScoreCard
					currentGameData={currentGameData}
					refreshData={() => handleRefreshData(overrideMode)}
					error={error}
					loading={loading}
				/>
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
