import React, { useState, useEffect, useRef } from 'react';
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Card,
	CardBody,
} from '@nextui-org/react';
import { mockGames } from '../utils/mockData';
import { RefreshCw } from 'lucide-react';

interface DevOverrideProps {
	overrideVisible: boolean;
	currentOverrideMode?: string;
	refreshData: (
		overrideMode?: string,
		setIsRefreshing?: (isRefreshing: boolean) => void
	) => Promise<void>;
}

const DevOverride: React.FC<DevOverrideProps> = ({
	overrideVisible,
	currentOverrideMode,
	refreshData,
}) => {
	const [selectedMode, setSelectedMode] = useState<string>(
		currentOverrideMode || 'live'
	);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const skipLiveRefreshRef = useRef(false);

	useEffect(() => {
		setSelectedMode(currentOverrideMode || 'live');
	}, [currentOverrideMode]);

	if (!overrideVisible) return null;

	const handleModeChange = async (mode: string) => {
		skipLiveRefreshRef.current = true;
		setSelectedMode(mode);
		setIsRefreshing(true);
		try {
			await refreshData(mode === 'live' ? undefined : mode, setIsRefreshing);
		} finally {
			window.setTimeout(() => {
				skipLiveRefreshRef.current = false;
			}, 400);
		}
	};

	const handleRefreshLiveData = async () => {
		if (skipLiveRefreshRef.current) return;
		setIsRefreshing(true);
		await refreshData(undefined, setIsRefreshing);
	};

	return (
		<Card className='fixed bottom-4 left-4 z-50 bg-background/60 dark:bg-default-100/50 w-[280px]'>
			<CardBody>
				<div className='flex flex-col gap-2'>
					<Dropdown placement='top'>
						<DropdownTrigger>
							<Button variant='bordered' disabled={isRefreshing} fullWidth>
								{selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Mock data scenarios'
							onAction={(key) => handleModeChange(key as string)}
							className='max-h-[300px] overflow-y-auto dropdown-menu-override'>
							<DropdownItem key='live'>Live</DropdownItem>
							{Object.keys(mockGames).map((mode) => (
								<DropdownItem key={mode}>
									{mode.charAt(0).toUpperCase() + mode.slice(1)}
								</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
					<Button
						size='sm'
						onClick={handleRefreshLiveData}
						disabled={isRefreshing}
						color='primary'>
						<RefreshCw size={16} />
						{isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export default DevOverride;
