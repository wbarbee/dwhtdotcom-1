'use client';
import { useEffect, useState } from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import ScoreCard from '../components/card';
import SeasonRecord from '../components/season-record';
import RivalryTracker from '../components/rivalry-tracker';
import HookEmIndex from '../components/hook-em-index';
import LastSeasonResults from '../components/last-season-results';
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
	const isOffseason = !hasCompletedGames;

	// Derive season label from game data (e.g., "'25-'26")
	const seasonLabel = (() => {
		if (allGames.length === 0) return '';
		const firstGame = [...allGames].sort((a, b) => a.timestamp - b.timestamp)[0];
		const startDate = new Date(firstGame.timestamp);
		const startYear = startDate.getMonth() >= 7 ? startDate.getFullYear() : startDate.getFullYear() - 1;
		const endYear = startYear + 1;
		return `'${String(startYear).slice(-2)}-'${String(endYear).slice(-2)}`;
	})();

	return (
		<div className='relative w-full min-h-screen dot-grid overflow-hidden'>
			<div className='ambient-orb ambient-orb-1' aria-hidden='true' />
			<div className='ambient-orb ambient-orb-2' aria-hidden='true' />
			<DevOverride
				overrideVisible={overrideVisible}
				currentOverrideMode={overrideMode}
				refreshData={handleRefreshData}
			/>
			<div className='flex flex-col items-center w-full gap-4 pt-[8vh] pb-8 px-4'>
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

				{/* Tabs */}
				{!loading && (
					<div className='w-[90%] max-w-[810px]'>
						<Tabs
							aria-label='Content tabs'
							variant='underlined'
							defaultSelectedKey={isOffseason ? 'index' : 'rivalries'}
							classNames={{
								base: 'w-full overflow-x-auto scrollbar-hide',
								tabList:
									'gap-6 w-max relative rounded-none p-0 border-b border-white/5 flex-nowrap',
								cursor: 'w-full bg-burntOrange transition-all duration-300',
								tab: 'max-w-fit px-0 h-10 whitespace-nowrap',
								tabContent:
									'group-data-[selected=true]:text-burntOrange text-foreground/40 text-sm font-display',
								panel: 'animate-fade-in',
							}}
						>
							{hasCompletedGames && (
								<Tab key='rivalries' title='Rivalries'>
									<div className='pt-3'>
										<RivalryTracker games={allGames} />
									</div>
								</Tab>
							)}
							<Tab
								key='index'
								title={
									isOffseason
										? "Last Season's Hook Them Index"
										: 'Hook Them Index'
								}
							>
								<div className='pt-3'>
									<HookEmIndex games={allGames} />
								</div>
							</Tab>
							{isOffseason && (
								<Tab key='last-season-results' title="Last Season's Outcomes">
									<div className='pt-3'>
										<LastSeasonResults />
									</div>
								</Tab>
							)}
						</Tabs>
					</div>
				)}
			</div>
		</div>
	);
}
