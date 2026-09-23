'use client';
import { useEffect, useState } from 'react';
import ScoreCard from '../components/card';
import SeasonRecord from '../components/season-record';
import { ScheduleList } from '../components/modal';
import HookEmIndex from '../components/hook-em-index';
import LastSeasonResults from '../components/last-season-results';
import DevOverride from '../components/dev-override';
import { useCurrentGameData } from '../hooks/useCurrentGameData';

type TabKey = 'last-season-results' | 'index' | 'schedule';

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
	const [activeTab, setActiveTab] = useState<TabKey | null>(null);

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

	// Derive season label (e.g., "'25-'26")
	// During off-season, derive from current date (last season); during season, from game data
	const seasonLabel = (() => {
		const now = new Date();
		let startYear: number;
		if (isOffseason) {
			// Match the season requested by fetchLastSeasonData.
			startYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
		} else if (allGames.length > 0) {
			const firstGame = [...allGames].sort((a, b) => a.timestamp - b.timestamp)[0];
			const firstDate = new Date(firstGame.timestamp);
			startYear = firstDate.getMonth() >= 7 ? firstDate.getFullYear() : firstDate.getFullYear() - 1;
		} else {
			return '';
		}
		const endYear = startYear + 1;
		return `'${String(startYear).slice(-2)}-'${String(endYear).slice(-2)}`;
	})();

	const resolvedTab: TabKey =
		activeTab ?? (isOffseason ? 'last-season-results' : 'index');

	const tabs: { key: TabKey; label: string }[] = [
		...(isOffseason
			? [{ key: 'last-season-results' as const, label: `${seasonLabel} Record` }]
			: []),
		{
			key: 'index',
			label: isOffseason
				? `${seasonLabel} Hook Them Index`
				: 'Hook Them Index',
		},
		...(!isOffseason ? [{ key: 'schedule' as const, label: 'Schedule' }] : []),
	];

	const tabList = (
		<div
			role='tablist'
			aria-label='Content tabs'
			className='flex shrink-0 gap-6 border-b border-black/10 dark:border-white/5 overflow-x-auto scrollbar-hide px-1'
		>
			{tabs.map((tab) => {
				const selected = resolvedTab === tab.key;
				return (
					<button
						key={tab.key}
						type='button'
						role='tab'
						aria-selected={selected}
						id={`tab-${tab.key}`}
						aria-controls={`panel-${tab.key}`}
						className={`relative h-10 px-0 whitespace-nowrap text-sm font-display transition-colors ${
							selected
								? 'text-burntOrange'
								: 'text-foreground/40 hover:text-foreground/60'
						}`}
						onClick={() => setActiveTab(tab.key)}
					>
						{tab.label}
						{selected && (
							<span className='absolute inset-x-0 -bottom-px h-0.5 bg-burntOrange' />
						)}
					</button>
				);
			})}
		</div>
	);

	const tabPanel = (
		<div
			role='tabpanel'
			id={`panel-${resolvedTab}`}
			aria-labelledby={`tab-${resolvedTab}`}
			className='flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain animate-fade-in'
		>
			{resolvedTab === 'last-season-results' && (
				<div className='pt-4'>
					<LastSeasonResults />
				</div>
			)}
			{resolvedTab === 'index' && (
				<HookEmIndex
					games={allGames}
					bare
					className='min-h-full px-0 pt-4 pb-1'
				/>
			)}
			{resolvedTab === 'schedule' && (
				<div className='pt-4 pb-1'>
					<ScheduleList />
					<p className='text-[10px] text-foreground/30 mt-3 px-1'>
						<span className='text-accent-gold'>*</span> neutral site
					</p>
				</div>
			)}
		</div>
	);

	return (
		<div className='relative w-full min-h-screen dot-grid overflow-x-hidden'>
			<div className='ambient-orb ambient-orb-1' aria-hidden='true' />
			<div className='ambient-orb ambient-orb-2' aria-hidden='true' />
			<DevOverride
				overrideVisible={overrideVisible}
				currentOverrideMode={overrideMode}
				refreshData={handleRefreshData}
			/>
			<div className='flex flex-col items-center justify-center w-full min-h-[100dvh] px-4 py-10'>
				<div
					className={`w-full max-w-[810px] lg:max-w-[1120px] flex flex-col gap-3 ${
						!loading
							? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5 lg:items-stretch'
							: ''
					}`}
				>
					{/* Left: modules 1 + 2 — h-full + flex-1 so Safari fills stretched grid row */}
					<div className='flex flex-col gap-3 min-h-0 min-w-0 w-full lg:h-full'>
						{hasCompletedGames && !loading && (
							<div className='shrink-0 w-full'>
								<SeasonRecord
									games={allGames}
									currentGame={currentGameData}
								/>
							</div>
						)}
						<div className='flex flex-col min-h-0 min-w-0 w-full lg:flex-1'>
							<ScoreCard
								currentGameData={currentGameData}
								refreshData={() => handleRefreshData(overrideMode)}
								error={error}
								loading={loading}
								className='w-full max-w-none min-h-0 lg:flex-1 lg:h-auto'
							/>
						</div>
					</div>

					{/* Right: module 3 — overflow clip + inner scroll (Safari spills without this) */}
					{!loading && (
						<div className='glass-card flex flex-col min-h-0 min-w-0 w-full overflow-hidden lg:h-full px-5 pt-2 pb-4'>
							{tabList}
							{tabPanel}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
