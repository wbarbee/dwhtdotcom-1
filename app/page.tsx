'use client';
import { useEffect, useState } from 'react';
import ScoreCard from '../components/card';
import Loading from '../components/loading';
import DevOverride from '../components/dev-override';
import { useCurrentGameData } from '../hooks/useCurrentGameData';
import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';
import { Game } from '../types';

export default function Home() {
	const {
		currentGameData,
		loading,
		error,
		refreshData: originalRefreshData,
	} = useCurrentGameData();
	const [overrideVisible, setOverrideVisible] = useState(false);
	const [mockGameData, setMockGameData] = useState<Game | null>(null);

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.key === '`') {
				setOverrideVisible((prev) => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, []);

	const refreshData = async (mockData?: Game) => {
		if (mockData) {
			setMockGameData(mockData);
		} else {
			setMockGameData(null);
			await originalRefreshData();
		}
	};

	if (loading) return <Loading />;

	const displayedGameData = mockGameData || currentGameData;

	return (
		<div className='relative w-full h-full'>
			<DevOverride
				overrideVisible={overrideVisible}
				refreshData={refreshData}
			/>
			<div className='absolute top-4 right-4'>
				{/* Add any top-right corner elements here */}
			</div>
			<div className='flex items-center justify-center w-full h-full'>
				<ScoreCard
					currentGameData={displayedGameData}
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
