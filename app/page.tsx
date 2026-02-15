'use client';
import { useEffect, useState } from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import ScoreCard from '../components/card';
import SeasonRecord from '../components/season-record';
import RivalryTracker from '../components/rivalry-tracker';
import HookEmIndex from '../components/hook-em-index';
import DevOverride from '../components/dev-override';
import { useCurrentGameData } from '../hooks/useCurrentGameData';

export default function Home() {
	const {
		currentGameData,
		allGames,
		loading,
		error,
		refreshData,
		overrideMode,
	} = useCurrentGameData();
	const [overrideVisible, setOverrideVisible] = useState(false);

	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			setOverrideVisible(true);
		} else {
			setOverrideVisible(false);
		}
	}, [overrideMode]);

	const handleRefreshData = async (
		newOverrideMode?: string,
		setIsRefreshing?: (isRefreshing: boolean) => void,
	) => {
		if (setIsRefreshing) setIsRefreshing(true);
		try {
			await refreshData(newOverrideMode);
		} finally {
			if (setIsRefreshing) setIsRefreshing(false);
		}
	};

	const hasCompletedGames = allGames.some((g) => g.status === 'STATUS_FINAL');

	return (
		<div className='relative w-full min-h-screen dot-grid'>
			<DevOverride
				overrideVisible={overrideVisible}
				currentOverrideMode={overrideMode}
				refreshData={handleRefreshData}
			/>
			<div className='flex flex-col items-center justify-center w-full min-h-screen gap-4 pt-4 pb-8 px-4'>
				{/* Season Record Bar */}
				{hasCompletedGames && !loading && (
					<div className='w-[90%] max-w-[810px]'>
						<SeasonRecord games={allGames} />
					</div>
				)}

				{/* Hero Card */}
				<ScoreCard
					currentGameData={currentGameData}
					refreshData={() => handleRefreshData(overrideMode)}
					error={error}
					loading={loading}
				/>

				{/* Tabs: Rivalries & Hook Them Index */}
				{!loading && (
					<div className='w-[90%] max-w-[810px]'>
						<Tabs
							aria-label='Content tabs'
							variant='underlined'
							defaultSelectedKey={hasCompletedGames ? 'rivalries' : 'index'}
							classNames={{
								tabList:
									'gap-6 w-full relative rounded-none p-0 border-b border-white/5',
								cursor: 'w-full bg-burntOrange',
								tab: 'max-w-fit px-0 h-10',
								tabContent:
									'group-data-[selected=true]:text-burntOrange text-foreground/40 text-sm font-display',
							}}
						>
							{hasCompletedGames && (
								<Tab key='rivalries' title='Rivalries'>
									<div className='pt-3'>
										<RivalryTracker games={allGames} />
									</div>
								</Tab>
							)}
							<Tab key='index' title={hasCompletedGames ? 'Hook Them Index' : "Last Season's Hook Them Index"}>
								<div className='pt-3'>
									<HookEmIndex games={allGames} />
								</div>
							</Tab>
						</Tabs>
					</div>
				)}
			</div>
		</div>
	);
}
