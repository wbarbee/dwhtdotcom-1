'use client';
import { useEffect, useState } from 'react';
import ScoreCard from '../components/card';
import DevOverride from '../components/dev-override';
import { useCurrentGameData } from '../hooks/useCurrentGameData';

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
		</div>
	);
}
